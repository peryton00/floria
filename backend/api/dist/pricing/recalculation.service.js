"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculationService = exports.RecalculationService = void 0;
// Floria API — Bulk Pricing Recalculation Engine & Read Model Worker
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
const policy_service_js_1 = require("./policy.service.js");
const pricing_service_js_1 = require("./pricing.service.js");
class RecalculationService {
    /**
     * Starts an asynchronous background batch recalculation job for a given policy version.
     */
    async startRecalculationJob(policyVersionId, adminUserId, batchSize = 500) {
        const policy = await policy_service_js_1.policyService.getPolicyById(policyVersionId);
        if (!policy)
            throw errors_js_1.Errors.notFound("Pricing policy version");
        const db = (0, database_js_1.getAdminDb)();
        // Fetch total active listings count
        const { data: listings, error: countErr } = await db
            .from("inventory")
            .select("product_id, seller_id, price_paise, base_price_paise")
            .gt("price_paise", 0);
        if (countErr) {
            throw errors_js_1.Errors.internal(`Failed to count inventory listings: ${countErr.message}`);
        }
        const totalListings = listings?.length || 0;
        const totalBatches = Math.ceil(totalListings / batchSize) || 1;
        // Create job record
        const { data: job, error: jobErr } = await db
            .from("pricing_recalculation_jobs")
            .insert({
            policy_version_id: policyVersionId,
            status: "in_progress",
            total_listings: totalListings,
            processed_listings: 0,
            failed_listings: 0,
            batch_size: batchSize,
            current_batch: 0,
            total_batches: totalBatches,
            created_by: adminUserId,
            started_at: new Date().toISOString(),
        })
            .select("*")
            .single();
        if (jobErr || !job) {
            throw errors_js_1.Errors.internal(`Failed to create recalculation job: ${jobErr?.message}`);
        }
        // Mark policy status as 'preparing'
        await db
            .from("pricing_policy_versions")
            .update({ status: "preparing", updated_at: new Date().toISOString() })
            .eq("id", policyVersionId);
        // Run batch processing asynchronously
        this.processJobBatches(job.id, policy, listings || [], batchSize).catch((err) => {
            console.error(`[RecalculationService] Job ${job.id} execution failed:`, err);
        });
        return this.mapDbToJob(job);
    }
    /**
     * Retrieves recalculation job status by job ID.
     */
    async getJobStatus(jobId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("pricing_recalculation_jobs")
            .select("*")
            .eq("id", jobId)
            .maybeSingle();
        if (error || !data)
            return null;
        return this.mapDbToJob(data);
    }
    /**
     * Retrieves the latest recalculation job for a given policy version.
     */
    async getLatestJobForPolicy(policyVersionId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("pricing_recalculation_jobs")
            .select("*")
            .eq("policy_version_id", policyVersionId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !data)
            return null;
        return this.mapDbToJob(data);
    }
    /**
     * Internal batch execution worker.
     */
    async processJobBatches(jobId, policy, listings, batchSize) {
        const db = (0, database_js_1.getAdminDb)();
        const policySettings = {
            sellerCommissionRate: policy.sellerCommissionRate,
            floriaProfitRate: policy.floriaProfitRate,
            platformMaintenanceFeePaise: policy.platformMaintenanceFeePaise,
            freeDeliveryThresholdPaise: policy.freeDeliveryThresholdPaise,
            freeDeliveryRecoveryPaise: policy.freeDeliveryRecoveryPaise,
        };
        let processedCount = 0;
        let failedCount = 0;
        const totalBatches = Math.ceil(listings.length / batchSize) || 1;
        try {
            for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
                const start = batchIdx * batchSize;
                const end = Math.min(start + batchSize, listings.length);
                const batchListings = listings.slice(start, end);
                const rowsToUpsert = [];
                for (const item of batchListings) {
                    try {
                        const basePaise = item.base_price_paise ?? item.price_paise ?? 0;
                        const calc = pricing_service_js_1.pricingService.calculateProductPricingSync(basePaise, policySettings);
                        rowsToUpsert.push({
                            product_id: item.product_id,
                            seller_id: item.seller_id,
                            policy_version_id: policy.id,
                            seller_base_price_paise: calc.sellerBasePricePaise,
                            floria_profit_rate: calc.floriaProfitRate,
                            floria_profit_paise: calc.floriaProfitPaise,
                            delivery_recovery_paise: calc.deliveryRecoveryPaise,
                            customer_product_price_paise: calc.customerProductPricePaise,
                            is_free_delivery_eligible: calc.isFreeDeliveryEligible,
                            seller_commission_rate: calc.sellerCommissionRate,
                            seller_commission_paise: calc.sellerCommissionPaise,
                            seller_net_paise: calc.sellerNetPaise,
                            is_override: false,
                            updated_at: new Date().toISOString(),
                        });
                        processedCount++;
                    }
                    catch {
                        failedCount++;
                    }
                }
                if (rowsToUpsert.length > 0) {
                    try {
                        await db
                            .from("product_pricing")
                            .upsert(rowsToUpsert, {
                            onConflict: "policy_version_id,product_id",
                        });
                    }
                    catch (e) {
                        console.warn(`[RecalculationService] Batch ${batchIdx + 1} upsert warning:`, e?.message);
                    }
                }
                // Update progress in job table
                await db
                    .from("pricing_recalculation_jobs")
                    .update({
                    processed_listings: processedCount,
                    failed_listings: failedCount,
                    current_batch: batchIdx + 1,
                    updated_at: new Date().toISOString(),
                })
                    .eq("id", jobId);
            }
            const isTotalFailure = processedCount === 0 && listings.length > 0;
            const finalJobStatus = isTotalFailure ? "failed" : "completed";
            const policyStatus = isTotalFailure ? "failed" : "ready";
            const now = new Date().toISOString();
            await db
                .from("pricing_recalculation_jobs")
                .update({
                status: finalJobStatus,
                error_message: failedCount > 0
                    ? `${failedCount} items failed during calculation`
                    : null,
                completed_at: now,
                updated_at: now,
            })
                .eq("id", jobId);
            await db
                .from("pricing_policy_versions")
                .update({ status: policyStatus, updated_at: now })
                .eq("id", policy.id);
        }
        catch (fatalErr) {
            const now = new Date().toISOString();
            await db
                .from("pricing_recalculation_jobs")
                .update({
                status: "failed",
                error_message: fatalErr?.message || "Fatal error during batch recalculation",
                completed_at: now,
                updated_at: now,
            })
                .eq("id", jobId);
            await db
                .from("pricing_policy_versions")
                .update({ status: "failed", updated_at: now })
                .eq("id", policy.id);
        }
    }
    mapDbToJob(row) {
        return {
            id: row.id,
            policyVersionId: row.policy_version_id,
            status: row.status,
            totalListings: row.total_listings,
            processedListings: row.processed_listings,
            failedListings: row.failed_listings,
            batchSize: row.batch_size,
            currentBatch: row.current_batch,
            totalBatches: row.total_batches,
            errorMessage: row.error_message,
            createdBy: row.created_by,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.RecalculationService = RecalculationService;
exports.recalculationService = new RecalculationService();
