"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = exports.PolicyService = void 0;
// Floria API — Pricing Policy Lifecycle, Versioning & Audit Service
const database_js_1 = require("../config/database.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
const pricing_service_js_1 = require("./pricing.service.js");
class PolicyService {
    /**
     * Retrieves all pricing policy versions ordered by version_number descending.
     */
    async listPolicyVersions() {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("pricing_policy_versions")
            .select("*")
            .order("version_number", { ascending: false });
        if (error || !data)
            return [];
        return data.map(this.mapDbToPolicyVersion);
    }
    /**
     * Retrieves the currently active pricing policy version.
     */
    async getActivePolicy() {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("pricing_policy_versions")
            .select("*")
            .eq("status", "active")
            .maybeSingle();
        if (error || !data)
            return null;
        return this.mapDbToPolicyVersion(data);
    }
    /**
     * Retrieves a policy version by ID.
     */
    async getPolicyById(policyId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("pricing_policy_versions")
            .select("*")
            .eq("id", policyId)
            .maybeSingle();
        if (error || !data)
            return null;
        return this.mapDbToPolicyVersion(data);
    }
    /**
     * Creates a new draft pricing policy version.
     */
    async createDraftPolicy(params, adminUserId) {
        // Validate bounds
        if (params.sellerCommissionRate < 0 || params.sellerCommissionRate > 50) {
            throw errors_js_1.Errors.validation("Seller commission rate must be between 0% and 50%");
        }
        if (params.floriaProfitRate < 0 || params.floriaProfitRate > 50) {
            throw errors_js_1.Errors.validation("Floria profit rate must be between 0% and 50%");
        }
        if (params.platformMaintenanceFeePaise < 0) {
            throw errors_js_1.Errors.validation("Platform maintenance fee cannot be negative");
        }
        if (params.freeDeliveryThresholdPaise < 0) {
            throw errors_js_1.Errors.validation("Free delivery threshold cannot be negative");
        }
        if (params.freeDeliveryRecoveryPaise < 0) {
            throw errors_js_1.Errors.validation("Free delivery recovery cannot be negative");
        }
        const db = (0, database_js_1.getAdminDb)();
        // Determine next version number
        const { data: latest } = await db
            .from("pricing_policy_versions")
            .select("version_number")
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();
        const nextVersion = (latest?.version_number ?? 0) + 1;
        const { data: created, error } = await db
            .from("pricing_policy_versions")
            .insert({
            version_number: nextVersion,
            seller_commission_rate: params.sellerCommissionRate,
            floria_profit_rate: params.floriaProfitRate,
            platform_maintenance_fee_paise: params.platformMaintenanceFeePaise,
            free_delivery_threshold_paise: params.freeDeliveryThresholdPaise,
            free_delivery_recovery_paise: params.freeDeliveryRecoveryPaise,
            status: "draft",
            notes: params.notes || `Draft version ${nextVersion}`,
            created_by: adminUserId,
        })
            .select("*")
            .single();
        if (error || !created) {
            throw errors_js_1.Errors.internal(`Failed to create pricing policy draft: ${error?.message}`);
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "create",
            resource_type: "pricing_policy_versions",
            resource_id: created.id,
            metadata: { new_data: created },
        });
        return this.mapDbToPolicyVersion(created);
    }
    /**
     * Previews the estimated financial impact of a draft policy version across existing inventory.
     */
    async previewPolicyImpact(policyId) {
        const policy = await this.getPolicyById(policyId);
        if (!policy)
            throw errors_js_1.Errors.notFound("Pricing policy version");
        const db = (0, database_js_1.getAdminDb)();
        const { data: inventoryItems } = await db
            .from("inventory")
            .select("product_id, price_paise, base_price_paise")
            .gt("price_paise", 0);
        const items = inventoryItems || [];
        if (items.length === 0) {
            return {
                policyVersionId: policyId,
                affectedListingsCount: 0,
                averageCustomerPriceChangePaise: 0,
                freeDeliveryEligibleListingsCount: 0,
                priceIncreaseCount: 0,
                priceDecreaseCount: 0,
                priceUnchangedCount: 0,
            };
        }
        let totalDiffPaise = 0;
        let freeDeliveryCount = 0;
        let increaseCount = 0;
        let decreaseCount = 0;
        let unchangedCount = 0;
        const policySettings = {
            sellerCommissionRate: policy.sellerCommissionRate,
            floriaProfitRate: policy.floriaProfitRate,
            platformMaintenanceFeePaise: policy.platformMaintenanceFeePaise,
            freeDeliveryThresholdPaise: policy.freeDeliveryThresholdPaise,
            freeDeliveryRecoveryPaise: policy.freeDeliveryRecoveryPaise,
        };
        for (const item of items) {
            const basePaise = item.base_price_paise ?? item.price_paise ?? 0;
            const newCalc = pricing_service_js_1.pricingService.calculateProductPricingSync(basePaise, policySettings);
            const currentPrice = item.price_paise ?? 0;
            const diff = newCalc.customerProductPricePaise - currentPrice;
            totalDiffPaise += diff;
            if (newCalc.isFreeDeliveryEligible)
                freeDeliveryCount++;
            if (diff > 0)
                increaseCount++;
            else if (diff < 0)
                decreaseCount++;
            else
                unchangedCount++;
        }
        return {
            policyVersionId: policyId,
            affectedListingsCount: items.length,
            averageCustomerPriceChangePaise: Math.round(totalDiffPaise / items.length),
            freeDeliveryEligibleListingsCount: freeDeliveryCount,
            priceIncreaseCount: increaseCount,
            priceDecreaseCount: decreaseCount,
            priceUnchangedCount: unchangedCount,
        };
    }
    /**
     * Atomically activates a prepared policy version and archives the previously active one.
     */
    async activatePolicy(policyId, adminUserId) {
        const policy = await this.getPolicyById(policyId);
        if (!policy)
            throw errors_js_1.Errors.notFound("Pricing policy version");
        if (policy.status === "active") {
            return policy;
        }
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        // 1. Archive previously active policy
        await db
            .from("pricing_policy_versions")
            .update({
            status: "archived",
            archived_at: now,
            updated_at: now,
        })
            .eq("status", "active");
        // 2. Activate target policy
        const { data: activated, error } = await db
            .from("pricing_policy_versions")
            .update({
            status: "active",
            activated_at: now,
            updated_at: now,
        })
            .eq("id", policyId)
            .select("*")
            .single();
        if (error || !activated) {
            throw errors_js_1.Errors.internal(`Failed to activate pricing policy: ${error?.message}`);
        }
        // 3. Mirror to platform_settings for backward compatibility
        await db.from("platform_settings").upsert([
            { key: "seller_commission_rate", value: activated.seller_commission_rate, updated_at: now, updated_by: adminUserId },
            { key: "floria_profit_rate", value: activated.floria_profit_rate, updated_at: now, updated_by: adminUserId },
            { key: "platform_maintenance_fee_paise", value: activated.platform_maintenance_fee_paise, updated_at: now, updated_by: adminUserId },
            { key: "free_delivery_threshold_paise", value: activated.free_delivery_threshold_paise, updated_at: now, updated_by: adminUserId },
            { key: "free_delivery_recovery_paise", value: activated.free_delivery_recovery_paise, updated_at: now, updated_by: adminUserId },
        ]);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "activate",
            resource_type: "pricing_policy_versions",
            resource_id: policyId,
            metadata: { new_data: activated },
        });
        return this.mapDbToPolicyVersion(activated);
    }
    /**
     * Sets or updates an admin product pricing override.
     */
    async setProductOverride(params, adminUserId) {
        if (params.customCustomerPricePaise <= 0) {
            throw errors_js_1.Errors.validation("Custom price must be greater than 0");
        }
        if (!params.reason || params.reason.trim().length === 0) {
            throw errors_js_1.Errors.validation("A reason is mandatory for setting a price override");
        }
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        const { data: override, error } = await db
            .from("product_pricing_overrides")
            .insert({
            product_id: params.productId,
            custom_customer_price_paise: params.customCustomerPricePaise,
            reason: params.reason.trim(),
            created_by: adminUserId,
            is_active: true,
        })
            .select("*")
            .single();
        if (error || !override) {
            throw errors_js_1.Errors.internal(`Failed to set product override: ${error?.message}`);
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "create",
            resource_type: "product_pricing_overrides",
            resource_id: override.id,
            metadata: { new_data: override },
        });
        return override;
    }
    /**
     * Deactivates an admin product pricing override.
     */
    async removeProductOverride(productId, adminUserId) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("product_pricing_overrides")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("product_id", productId);
        if (error) {
            throw errors_js_1.Errors.internal(`Failed to remove product override: ${error.message}`);
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "delete",
            resource_type: "product_pricing_overrides",
            resource_id: productId,
        });
        return { removed: true };
    }
    mapDbToPolicyVersion(row) {
        return {
            id: row.id,
            versionNumber: row.version_number,
            sellerCommissionRate: Number(row.seller_commission_rate),
            floriaProfitRate: Number(row.floria_profit_rate),
            platformMaintenanceFeePaise: Number(row.platform_maintenance_fee_paise),
            freeDeliveryThresholdPaise: Number(row.free_delivery_threshold_paise),
            freeDeliveryRecoveryPaise: Number(row.free_delivery_recovery_paise),
            status: row.status,
            notes: row.notes,
            createdBy: row.created_by,
            activatedAt: row.activated_at,
            archivedAt: row.archived_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.PolicyService = PolicyService;
exports.policyService = new PolicyService();
