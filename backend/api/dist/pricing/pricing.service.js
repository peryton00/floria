"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingService = exports.PricingService = void 0;
// Floria API — Server-Authoritative Product Pricing, Profit & Financial Engine
const database_js_1 = require("../config/database.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
class PricingService {
    /**
     * Retrieves database-configured financial parameters from platform_settings.
     */
    async getFinancialSettings() {
        const db = (0, database_js_1.getAdminDb)();
        const { data: rows } = await db
            .from("platform_settings")
            .select("key, value")
            .in("key", [
            "seller_commission_rate",
            "floria_profit_rate",
            "platform_maintenance_fee_paise",
            "free_delivery_threshold_paise",
            "free_delivery_recovery_paise",
        ]);
        const map = new Map((rows || []).map((r) => [r.key, r.value]));
        const sellerCommissionRate = map.has("seller_commission_rate")
            ? Number(map.get("seller_commission_rate"))
            : 12.0;
        const floriaProfitRate = map.has("floria_profit_rate")
            ? Number(map.get("floria_profit_rate"))
            : 2.0;
        const platformMaintenanceFeePaise = map.has("platform_maintenance_fee_paise")
            ? Number(map.get("platform_maintenance_fee_paise"))
            : 1000; // ₹10.00
        const freeDeliveryThresholdPaise = map.has("free_delivery_threshold_paise")
            ? Number(map.get("free_delivery_threshold_paise"))
            : 59900; // ₹599.00
        const freeDeliveryRecoveryPaise = map.has("free_delivery_recovery_paise")
            ? Number(map.get("free_delivery_recovery_paise"))
            : 2000; // ₹20.00
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
    async updateFinancialSettings(updates, adminUserId) {
        const db = (0, database_js_1.getAdminDb)();
        const previous = await this.getFinancialSettings();
        if (updates.sellerCommissionRate !== undefined) {
            if (typeof updates.sellerCommissionRate !== "number" || updates.sellerCommissionRate < 0 || updates.sellerCommissionRate > 50) {
                throw errors_js_1.Errors.validation("Seller commission rate must be a valid number between 0% and 50%.");
            }
        }
        if (updates.floriaProfitRate !== undefined) {
            if (typeof updates.floriaProfitRate !== "number" || updates.floriaProfitRate < 0 || updates.floriaProfitRate > 50) {
                throw errors_js_1.Errors.validation("Floria profit rate must be a valid number between 0% and 50%.");
            }
        }
        if (updates.platformMaintenanceFeePaise !== undefined) {
            if (typeof updates.platformMaintenanceFeePaise !== "number" || updates.platformMaintenanceFeePaise < 0) {
                throw errors_js_1.Errors.validation("Platform maintenance fee must be a non-negative integer in paise.");
            }
        }
        if (updates.freeDeliveryThresholdPaise !== undefined) {
            if (typeof updates.freeDeliveryThresholdPaise !== "number" || updates.freeDeliveryThresholdPaise < 0) {
                throw errors_js_1.Errors.validation("Free delivery threshold must be a non-negative integer in paise.");
            }
        }
        if (updates.freeDeliveryRecoveryPaise !== undefined) {
            if (typeof updates.freeDeliveryRecoveryPaise !== "number" || updates.freeDeliveryRecoveryPaise < 0) {
                throw errors_js_1.Errors.validation("Free delivery recovery must be a non-negative integer in paise.");
            }
        }
        const payload = [];
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
            await db.from("platform_settings").upsert({
                key: item.key,
                value: item.value,
                value_type: item.value_type,
                description: item.description,
                updated_at: now,
                updated_by: adminUserId,
            }, { onConflict: "key" });
            await audit_repository_js_1.auditRepository.log({
                actor_user_id: adminUserId,
                actor_role: "admin",
                action: item.action,
                resource_type: "platform_setting",
                resource_id: item.key,
                metadata: { previous: previous[item.key], new: item.value },
            });
        }
        return this.getFinancialSettings();
    }
    /**
     * Deterministically calculates all product financial components in integer paise.
     */
    async calculateProductPricing(sellerBasePricePaise, customSettings) {
        if (typeof sellerBasePricePaise !== "number" || sellerBasePricePaise < 0 || isNaN(sellerBasePricePaise)) {
            throw errors_js_1.Errors.validation("Seller base price must be a non-negative integer in paise.");
        }
        const settings = customSettings || (await this.getFinancialSettings());
        // 1. Seller Commission (deducted from seller base price)
        const sellerCommissionPaise = Math.round(sellerBasePricePaise * (settings.sellerCommissionRate / 100.0));
        const sellerNetPaise = sellerBasePricePaise - sellerCommissionPaise;
        // 2. Floria Profit Margin (added to seller base price)
        const floriaProfitPaise = Math.round(sellerBasePricePaise * (settings.floriaProfitRate / 100.0));
        const preRecoveryPricePaise = sellerBasePricePaise + floriaProfitPaise;
        // 3. Product-Level Free Delivery Eligibility & Recovery
        // A product qualifies if its pre-recovery customer price >= threshold (e.g. ₹599.00 = 59900 paise)
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
}
exports.PricingService = PricingService;
exports.pricingService = new PricingService();
