// Floria API — Server-Authoritative Delivery Fee Engine Service
import { getAdminDb } from "../config/database.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";
import type { DeliverySettings, DeliveryCalculationResult } from "@floria/types";

export class DeliveryService {
  async getDeliverySettings(): Promise<DeliverySettings> {
    const db = getAdminDb();
    const { data: rows } = await db
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "delivery_enabled",
        "base_delivery_fee_paise",
        "free_delivery_enabled",
        "free_delivery_threshold_paise",
        "master_order_delivery_mode",
      ]);

    const settingsMap = new Map((rows || []).map((r) => [r.key, r.value]));

    const deliveryEnabled = settingsMap.has("delivery_enabled")
      ? Boolean(settingsMap.get("delivery_enabled"))
      : true;

    const baseDeliveryFeePaise = settingsMap.has("base_delivery_fee_paise")
      ? Number(settingsMap.get("base_delivery_fee_paise"))
      : 4000; // Default ₹40.00

    const freeDeliveryEnabled = settingsMap.has("free_delivery_enabled")
      ? Boolean(settingsMap.get("free_delivery_enabled"))
      : true;

    const freeDeliveryThresholdPaise = settingsMap.has("free_delivery_threshold_paise")
      ? Number(settingsMap.get("free_delivery_threshold_paise"))
      : 99900; // Default ₹999.00

    const masterOrderDeliveryMode = (settingsMap.get("master_order_delivery_mode") as any) || "master_order_single";

    return {
      deliveryEnabled,
      baseDeliveryFeePaise,
      freeDeliveryEnabled,
      freeDeliveryThresholdPaise,
      masterOrderDeliveryMode,
    };
  }

  async updateDeliverySettings(updates: Partial<DeliverySettings>, adminUserId: string): Promise<DeliverySettings> {
    const db = getAdminDb();
    const previous = await this.getDeliverySettings();

    if (updates.baseDeliveryFeePaise !== undefined) {
      if (typeof updates.baseDeliveryFeePaise !== "number" || updates.baseDeliveryFeePaise < 0) {
        throw Errors.validation("Base delivery fee must be a non-negative integer in paise.");
      }
    }

    if (updates.freeDeliveryThresholdPaise !== undefined) {
      if (typeof updates.freeDeliveryThresholdPaise !== "number" || updates.freeDeliveryThresholdPaise < 0) {
        throw Errors.validation("Free delivery threshold must be a non-negative integer in paise.");
      }
    }

    const payloadUpdates: Array<{ key: string; value: any; value_type: string; description: string }> = [];

    if (updates.deliveryEnabled !== undefined) {
      payloadUpdates.push({
        key: "delivery_enabled",
        value: updates.deliveryEnabled,
        value_type: "boolean",
        description: "Master toggle for platform delivery calculation",
      });
    }

    if (updates.baseDeliveryFeePaise !== undefined) {
      payloadUpdates.push({
        key: "base_delivery_fee_paise",
        value: updates.baseDeliveryFeePaise,
        value_type: "number",
        description: "Base delivery fee in paise (e.g. 4000 = ₹40.00)",
      });
    }

    if (updates.freeDeliveryEnabled !== undefined) {
      payloadUpdates.push({
        key: "free_delivery_enabled",
        value: updates.freeDeliveryEnabled,
        value_type: "boolean",
        description: "Toggle for free delivery threshold rule",
      });
    }

    if (updates.freeDeliveryThresholdPaise !== undefined) {
      payloadUpdates.push({
        key: "free_delivery_threshold_paise",
        value: updates.freeDeliveryThresholdPaise,
        value_type: "number",
        description: "Free delivery minimum subtotal threshold in paise (e.g. 99900 = ₹999.00)",
      });
    }

    if (updates.masterOrderDeliveryMode !== undefined) {
      payloadUpdates.push({
        key: "master_order_delivery_mode",
        value: updates.masterOrderDeliveryMode,
        value_type: "string",
        description: "Delivery fee mode per master order",
      });
    }

    const now = new Date().toISOString();
    for (const item of payloadUpdates) {
      await db.from("platform_settings").upsert(
        {
          key: item.key,
          value: item.value,
          value_type: item.value_type,
          description: item.description,
          updated_at: now,
          updated_by: adminUserId,
        },
        { onConflict: "key" }
      );
    }

    // Audit Log
    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "DELIVERY_SETTINGS_UPDATED",
      resource_type: "platform_setting",
      resource_id: "delivery_settings",
      metadata: { previous, updated: updates },
    });

    return this.getDeliverySettings();
  }

  async calculateDeliveryFee(input: { eligibleSubtotalPaise: number }): Promise<DeliveryCalculationResult> {
    const settings = await this.getDeliverySettings();

    if (!settings.deliveryEnabled) {
      return {
        deliveryFeePaise: 0,
        isFreeDelivery: true,
        reason: "DELIVERY_DISABLED",
        thresholdPaise: settings.freeDeliveryThresholdPaise,
        eligibleSubtotalPaise: input.eligibleSubtotalPaise,
        baseDeliveryFeePaise: settings.baseDeliveryFeePaise,
      };
    }

    if (settings.freeDeliveryEnabled && input.eligibleSubtotalPaise >= settings.freeDeliveryThresholdPaise) {
      return {
        deliveryFeePaise: 0,
        isFreeDelivery: true,
        reason: "FREE_DELIVERY_THRESHOLD",
        thresholdPaise: settings.freeDeliveryThresholdPaise,
        eligibleSubtotalPaise: input.eligibleSubtotalPaise,
        baseDeliveryFeePaise: settings.baseDeliveryFeePaise,
      };
    }

    return {
      deliveryFeePaise: settings.baseDeliveryFeePaise,
      isFreeDelivery: false,
      reason: "PAID_BELOW_THRESHOLD",
      thresholdPaise: settings.freeDeliveryThresholdPaise,
      eligibleSubtotalPaise: input.eligibleSubtotalPaise,
      baseDeliveryFeePaise: settings.baseDeliveryFeePaise,
    };
  }
}

export const deliveryService = new DeliveryService();
