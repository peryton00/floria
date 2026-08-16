// Floria API — Server-Authoritative Product Pricing, Profit & Financial Engine
import { getAdminDb } from "../config/database.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";
import type { FinancialSettings, ProductPricingCalculation } from "@floria/types";

export class PricingService {
  /**
   * Retrieves database-configured financial parameters from platform_settings.
   */
  /**
   * Retrieves database-configured financial parameters from active pricing policy version or platform_settings.
   */
  async getFinancialSettings(): Promise<FinancialSettings> {
    const db = getAdminDb();

    // 1. Try active pricing policy version
    try {
      const { data: activeVersion } = await db
        .from("pricing_policy_versions")
        .select("*")
        .eq("status", "active")
        .maybeSingle();

      if (activeVersion) {
        return {
          sellerCommissionRate: Number(activeVersion.seller_commission_rate),
          floriaProfitRate: Number(activeVersion.floria_profit_rate),
          platformMaintenanceFeePaise: Number(activeVersion.platform_maintenance_fee_paise),
          freeDeliveryThresholdPaise: Number(activeVersion.free_delivery_threshold_paise),
          freeDeliveryRecoveryPaise: Number(activeVersion.free_delivery_recovery_paise),
        };
      }
    } catch {
      // Fallback if table doesn't exist yet or in unit tests
    }

    // 2. Fallback to platform_settings
    let rows: any[] = [];
    try {
      const q = db.from("platform_settings").select("key, value");
      if (typeof (q as any)?.in === "function") {
        const res = await (q as any).in("key", [
          "seller_commission_rate",
          "floria_profit_rate",
          "platform_maintenance_fee_paise",
          "free_delivery_threshold_paise",
          "free_delivery_recovery_paise",
        ]);
        rows = res?.data || [];
      } else if (typeof (q as any)?.then === "function") {
        const res = await q;
        rows = res?.data || [];
      }
    } catch {
      rows = [];
    }

    const map = new Map((rows || []).map((r: any) => [r.key, r.value]));

    const sellerCommissionRate = map.has("seller_commission_rate")
      ? Number(map.get("seller_commission_rate"))
      : 0;

    const floriaProfitRate = map.has("floria_profit_rate")
      ? Number(map.get("floria_profit_rate"))
      : 0;

    const platformMaintenanceFeePaise = map.has("platform_maintenance_fee_paise")
      ? Number(map.get("platform_maintenance_fee_paise"))
      : 0;

    const freeDeliveryThresholdPaise = map.has("free_delivery_threshold_paise")
      ? Number(map.get("free_delivery_threshold_paise"))
      : 0;

    const freeDeliveryRecoveryPaise = map.has("free_delivery_recovery_paise")
      ? Number(map.get("free_delivery_recovery_paise"))
      : 0;

    return {
      sellerCommissionRate,
      floriaProfitRate,
      platformMaintenanceFeePaise,
      freeDeliveryThresholdPaise,
      freeDeliveryRecoveryPaise,
    };
  }

  /**
   * Updates platform financial settings and creates immutable audit logs.
   */
  async updateFinancialSettings(
    updates: Partial<FinancialSettings>,
    adminUserId: string
  ): Promise<FinancialSettings> {
    const db = getAdminDb();
    const previous = await this.getFinancialSettings();

    if (updates.sellerCommissionRate !== undefined) {
      if (typeof updates.sellerCommissionRate !== "number" || updates.sellerCommissionRate < 0 || updates.sellerCommissionRate > 50) {
        throw Errors.validation("Seller commission rate must be a valid number between 0% and 50%.");
      }
    }

    if (updates.floriaProfitRate !== undefined) {
      if (typeof updates.floriaProfitRate !== "number" || updates.floriaProfitRate < 0 || updates.floriaProfitRate > 50) {
        throw Errors.validation("Floria profit rate must be a valid number between 0% and 50%.");
      }
    }

    if (updates.platformMaintenanceFeePaise !== undefined) {
      if (typeof updates.platformMaintenanceFeePaise !== "number" || updates.platformMaintenanceFeePaise < 0) {
        throw Errors.validation("Platform maintenance fee must be a non-negative integer in paise.");
      }
    }

    if (updates.freeDeliveryThresholdPaise !== undefined) {
      if (typeof updates.freeDeliveryThresholdPaise !== "number" || updates.freeDeliveryThresholdPaise < 0) {
        throw Errors.validation("Free delivery threshold must be a non-negative integer in paise.");
      }
    }

    if (updates.freeDeliveryRecoveryPaise !== undefined) {
      if (typeof updates.freeDeliveryRecoveryPaise !== "number" || updates.freeDeliveryRecoveryPaise < 0) {
        throw Errors.validation("Free delivery recovery must be a non-negative integer in paise.");
      }
    }

    const payload: Array<{ key: string; value: any; value_type: string; description: string; action: string }> = [];

    if (updates.sellerCommissionRate !== undefined) {
      payload.push({
        key: "seller_commission_rate",
        value: updates.sellerCommissionRate,
        value_type: "number",
        description: "Seller commission percentage rate cut from seller base price",
        action: "SELLER_COMMISSION_UPDATED",
      });
    }

    if (updates.floriaProfitRate !== undefined) {
      payload.push({
        key: "floria_profit_rate",
        value: updates.floriaProfitRate,
        value_type: "number",
        description: "Floria internal profit margin rate added to product price",
        action: "FLORIA_PROFIT_RATE_UPDATED",
      });
    }

    if (updates.platformMaintenanceFeePaise !== undefined) {
      payload.push({
        key: "platform_maintenance_fee_paise",
        value: updates.platformMaintenanceFeePaise,
        value_type: "number",
        description: "Platform maintenance fee charged once per checkout in paise",
        action: "PLATFORM_MAINTENANCE_FEE_UPDATED",
      });
    }

    if (updates.freeDeliveryThresholdPaise !== undefined) {
      payload.push({
        key: "free_delivery_threshold_paise",
        value: updates.freeDeliveryThresholdPaise,
        value_type: "number",
        description: "Product price threshold for free delivery in paise",
        action: "FREE_DELIVERY_POLICY_UPDATED",
      });
    }

    if (updates.freeDeliveryRecoveryPaise !== undefined) {
      payload.push({
        key: "free_delivery_recovery_paise",
        value: updates.freeDeliveryRecoveryPaise,
        value_type: "number",
        description: "Hidden product-level delivery recovery amount in paise",
        action: "DELIVERY_RECOVERY_UPDATED",
      });
    }

    const now = new Date().toISOString();
    for (const item of payload) {
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

      await auditRepository.log({
        actor_user_id: adminUserId,
        actor_role: "admin",
        action: item.action,
        resource_type: "platform_setting",
        resource_id: item.key,
        metadata: { previous: (previous as any)[item.key], new: item.value },
      });
    }

    return this.getFinancialSettings();
  }

  /**
   * Deterministically calculates all product financial components in integer paise.
   */
  async calculateProductPricing(
    sellerBasePricePaise: number,
    customSettings?: FinancialSettings
  ): Promise<ProductPricingCalculation> {
    if (typeof sellerBasePricePaise !== "number" || sellerBasePricePaise < 0 || isNaN(sellerBasePricePaise)) {
      throw Errors.validation("Seller base price must be a non-negative integer in paise.");
    }

    const settings = customSettings || (await this.getFinancialSettings());

    // 1. Seller Commission (deducted from seller base price)
    const sellerCommissionPaise = Math.round(sellerBasePricePaise * (settings.sellerCommissionRate / 100.0));
    const sellerNetPaise = sellerBasePricePaise - sellerCommissionPaise;

    // 2. Floria Profit Margin (added to seller base price)
    const floriaProfitPaise = Math.round(sellerBasePricePaise * (settings.floriaProfitRate / 100.0));
    const preRecoveryPricePaise = sellerBasePricePaise + floriaProfitPaise;

    // 3. Product-Level Free Delivery Eligibility & Recovery
    // A product qualifies if its pre-recovery customer price >= dynamic threshold from active policy
    const isFreeDeliveryEligible = preRecoveryPricePaise >= settings.freeDeliveryThresholdPaise;
    const deliveryRecoveryPaise = isFreeDeliveryEligible ? settings.freeDeliveryRecoveryPaise : 0;

    // 4. Customer Product Price
    const customerProductPricePaise = preRecoveryPricePaise + deliveryRecoveryPaise;

    return {
      sellerBasePricePaise,
      sellerCommissionRate: settings.sellerCommissionRate,
      sellerCommissionPaise,
      sellerNetPaise,
      floriaProfitRate: settings.floriaProfitRate,
      floriaProfitPaise,
      deliveryRecoveryPaise,
      customerProductPricePaise,
      isFreeDeliveryEligible,
      freeDeliveryThresholdPaise: settings.freeDeliveryThresholdPaise,
    };
  }

  /**
   * Synchronous variant using pre-fetched database financial settings.
   */
  calculateProductPricingSync(
    sellerBasePricePaise: number,
    settings: FinancialSettings
  ): ProductPricingCalculation {
    const validBasePrice = typeof sellerBasePricePaise === "number" && sellerBasePricePaise > 0 ? sellerBasePricePaise : 0;

    const sellerCommissionPaise = Math.round(validBasePrice * (settings.sellerCommissionRate / 100.0));
    const sellerNetPaise = validBasePrice - sellerCommissionPaise;

    const floriaProfitPaise = Math.round(validBasePrice * (settings.floriaProfitRate / 100.0));
    const preRecoveryPricePaise = validBasePrice + floriaProfitPaise;

    const isFreeDeliveryEligible = preRecoveryPricePaise >= settings.freeDeliveryThresholdPaise;
    const deliveryRecoveryPaise = isFreeDeliveryEligible ? settings.freeDeliveryRecoveryPaise : 0;

    const customerProductPricePaise = preRecoveryPricePaise + deliveryRecoveryPaise;

    return {
      sellerBasePricePaise: validBasePrice,
      sellerCommissionRate: settings.sellerCommissionRate,
      sellerCommissionPaise,
      sellerNetPaise,
      floriaProfitRate: settings.floriaProfitRate,
      floriaProfitPaise,
      deliveryRecoveryPaise,
      customerProductPricePaise,
      isFreeDeliveryEligible,
      freeDeliveryThresholdPaise: settings.freeDeliveryThresholdPaise,
    };
  }
}

export const pricingService = new PricingService();
