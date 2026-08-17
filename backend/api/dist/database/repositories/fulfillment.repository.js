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
        // Check direct match on seller_id
        const { data, error } = await db
            .from("seller_order_fulfillments")
            .select("*")
            .eq("order_id", orderId)
            .eq("seller_id", sellerId)
            .maybeSingle();
        if (!error && data)
            return data;
        // Check if sellerId is a profile ID with an associated user_id, or vice-versa
        const { data: prof } = await db
            .from("seller_profiles")
            .select("id, user_id")
            .or(`id.eq.${sellerId},user_id.eq.${sellerId}`)
            .maybeSingle();
        if (prof) {
            const altId = prof.id === sellerId ? prof.user_id : prof.id;
            if (altId) {
                const { data: altData } = await db
                    .from("seller_order_fulfillments")
                    .select("*")
                    .eq("order_id", orderId)
                    .eq("seller_id", altId)
                    .maybeSingle();
                if (altData)
                    return altData;
            }
        }
        return null;
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
