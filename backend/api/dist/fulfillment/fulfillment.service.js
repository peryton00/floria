"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fulfillmentService = exports.FulfillmentService = void 0;
// Floria API — Seller Fulfillment Service
const fulfillment_repository_js_1 = require("../database/repositories/fulfillment.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
const SELLER_STAGES = [
    "Order Placed",
    "Nursery Confirmed",
    "Preparing",
    "Ready for Pickup",
    "Picked Up",
];
const TIMESTAMP_COLS = {
    "Nursery Confirmed": "confirmed_at",
    Preparing: "preparing_at",
    "Ready for Pickup": "ready_at",
    "Picked Up": "picked_up_at",
};
class FulfillmentService {
    async getSellerFulfillments(sellerId) {
        return fulfillment_repository_js_1.fulfillmentRepository.findBySellerId(sellerId);
    }
    async updateStatus(actorUserId, sellerId, masterOrderId, newStatus) {
        if (!SELLER_STAGES.includes(newStatus)) {
            throw errors_js_1.Errors.validation(`Invalid fulfillment status: ${newStatus}`);
        }
        let record = await fulfillment_repository_js_1.fulfillmentRepository.findByOrderAndSeller(masterOrderId, sellerId);
        if (!record) {
            // Check if order exists in orders table to support legacy/demo/seed orders
            const { getAdminDb } = await import("../config/database.js");
            const db = getAdminDb();
            const { data: order } = await db
                .from("orders")
                .select("id, status")
                .eq("id", masterOrderId)
                .maybeSingle();
            if (!order) {
                // IDOR protection: throw 404 if order does not exist at all
                throw errors_js_1.Errors.notFound("Fulfillment record");
            }
            // Provision initial fulfillment record for this order & seller
            const { data: newRecord } = await db
                .from("seller_order_fulfillments")
                .insert({
                order_id: masterOrderId,
                seller_id: sellerId,
                status: "Order Placed",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
                .select()
                .maybeSingle();
            record = newRecord;
        }
        if (!record) {
            throw errors_js_1.Errors.notFound("Fulfillment record");
        }
        const currentStatus = record.status;
        const ci = SELLER_STAGES.indexOf(currentStatus);
        const ni = SELLER_STAGES.indexOf(newStatus);
        if (ni !== ci + 1) {
            throw errors_js_1.Errors.invalidTransition(currentStatus, newStatus);
        }
        const tsCol = TIMESTAMP_COLS[newStatus];
        const success = await fulfillment_repository_js_1.fulfillmentRepository.updateFulfillmentStatus(record.id, sellerId, newStatus, tsCol);
        if (!success)
            throw errors_js_1.Errors.database("Failed to update fulfillment status.");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: actorUserId,
            actor_role: "seller",
            action: "SELLER_FULFILLMENT_CHANGED",
            resource_type: "seller_order_fulfillment",
            resource_id: record.id,
            metadata: {
                order_id: masterOrderId,
                seller_id: sellerId,
                from: currentStatus,
                to: newStatus,
            },
        });
        return { status: newStatus, orderId: masterOrderId };
    }
}
exports.FulfillmentService = FulfillmentService;
exports.fulfillmentService = new FulfillmentService();
