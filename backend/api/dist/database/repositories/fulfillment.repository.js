"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fulfillmentRepository = exports.FulfillmentRepository = void 0;
// Floria API — Seller Fulfillment Repository
const database_js_1 = require("../../config/database.js");
class FulfillmentRepository {
    async findBySellerId(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_order_fulfillments")
            .select("*, orders(*)")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });
        if (error || !data)
            return [];
        return data;
    }
    async findByOrderAndSeller(orderId, sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_order_fulfillments")
            .select("*")
            .eq("order_id", orderId)
            .eq("seller_id", sellerId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async updateFulfillmentStatus(fulfillmentId, sellerId, newStatus, timestampField) {
        const db = (0, database_js_1.getAdminDb)();
        const payload = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };
        if (timestampField) {
            payload[timestampField] = new Date().toISOString();
        }
        const { error } = await db
            .from("seller_order_fulfillments")
            .update(payload)
            .eq("id", fulfillmentId)
            .eq("seller_id", sellerId);
        return !error;
    }
}
exports.FulfillmentRepository = FulfillmentRepository;
exports.fulfillmentRepository = new FulfillmentRepository();
