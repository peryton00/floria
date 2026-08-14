// Floria API — Settings Repository
import { getAdminDb } from "../../config/database.js";
import { auditRepository } from "./audit.repository.js";
import { Errors } from "../../utils/errors.js";

export class SettingsRepository {
  /**
   * Retrieves platform setting value by key.
   */
  async getSetting<T = any>(key: string): Promise<T | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data.value as T;
  }

  /**
   * Retrieves server-authoritative commission rate percentage.
   * Defaults to 12.0% if not found in database.
   */
  async getCommissionRate(): Promise<number> {
    const val = await this.getSetting<number>("platform_commission_rate");
    if (val === null || val === undefined || isNaN(Number(val))) {
      return 12.0; // Configured database fallback default
    }
    return Number(val);
  }

  /**
   * Updates platform_commission_rate in database, validates bounds (0.0% <= rate <= 50.0%),
   * and creates an immutable audit trail entry.
   */
  async updateCommissionRate(newRate: number, adminUserId: string): Promise<number> {
    if (typeof newRate !== "number" || !isFinite(newRate) || isNaN(newRate)) {
      throw Errors.validation("Commission rate must be a valid finite number.");
    }

    if (newRate < 0.0) {
      throw Errors.validation("Commission rate cannot be negative.");
    }

    if (newRate > 50.0) {
      throw Errors.validation("Commission rate cannot exceed maximum cap of 50.0%.");
    }

    const previousRate = await this.getCommissionRate();
    const db = getAdminDb();

    const { data, error } = await db
      .from("platform_settings")
      .upsert({
        key: "platform_commission_rate",
        value: newRate,
        value_type: "number",
        description: "Platform commission rate percentage applied server-side to order subtotals (e.g. 12.0 = 12.0%)",
        updated_at: new Date().toISOString(),
        updated_by: adminUserId,
      }, { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      throw Errors.internal("Failed to update platform commission rate setting in database.");
    }

    // Immutable Audit Trail
    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "PLATFORM_COMMISSION_UPDATED",
      resource_type: "platform_setting",
      resource_id: "platform_commission_rate",
      metadata: {
        previousRate,
        newRate,
      },
    });

    return Number(data.value);
  }
}

export const settingsRepository = new SettingsRepository();
