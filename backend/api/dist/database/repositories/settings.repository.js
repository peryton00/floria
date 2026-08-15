"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = exports.SettingsRepository = void 0;
// Floria API — Settings Repository
const database_js_1 = require("../../config/database.js");
const audit_repository_js_1 = require("./audit.repository.js");
const errors_js_1 = require("../../utils/errors.js");
class SettingsRepository {
    /**
     * Retrieves platform setting value by key.
     */
    async getSetting(key) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("platform_settings")
            .select("value")
            .eq("key", key)
            .maybeSingle();
        if (error || !data)
            return null;
        return data.value;
    }
    /**
     * Retrieves server-authoritative commission rate percentage.
     * Defaults to 12.0% if not found in database.
     */
    async getCommissionRate() {
        const val = await this.getSetting("platform_commission_rate");
        if (val === null || val === undefined || isNaN(Number(val))) {
            return 12.0; // Configured database fallback default
        }
        return Number(val);
    }
    /**
     * Updates platform_commission_rate in database, validates bounds (0.0% <= rate <= 50.0%),
     * and creates an immutable audit trail entry.
     */
    async updateCommissionRate(newRate, adminUserId) {
        if (typeof newRate !== "number" || !isFinite(newRate) || isNaN(newRate)) {
            throw errors_js_1.Errors.validation("Commission rate must be a valid finite number.");
        }
        if (newRate < 0.0) {
            throw errors_js_1.Errors.validation("Commission rate cannot be negative.");
        }
        if (newRate > 50.0) {
            throw errors_js_1.Errors.validation("Commission rate cannot exceed maximum cap of 50.0%.");
        }
        const previousRate = await this.getCommissionRate();
        const db = (0, database_js_1.getAdminDb)();
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
            throw errors_js_1.Errors.internal("Failed to update platform commission rate setting in database.");
        }
        // Immutable Audit Trail
        await audit_repository_js_1.auditRepository.log({
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
exports.SettingsRepository = SettingsRepository;
exports.settingsRepository = new SettingsRepository();
