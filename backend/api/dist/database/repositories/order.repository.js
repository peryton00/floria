"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = exports.OrderRepository = void 0;
// Floria API — Order Repository
const database_js_1 = require("../../config/database.js");
class OrderRepository {
    async findByCustomerId(customerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("orders")
            .select("*, order_items(*), seller_order_fulfillments(*)")
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false });
        if (error || !data)
            return [];
        return data;
    }
    async findById(orderId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("orders")
            .select("*, order_items(*), seller_order_fulfillments(*)")
            .eq("id", orderId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findAllMasterOrders(filters) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db
            .from("orders")
            .select("*, order_items(*, product:products(name,slug), seller:seller_profiles(id,business_name)), seller_order_fulfillments(*)")
            .order("created_at", { ascending: false });
        if (filters?.status && filters.status !== "all") {
            q = q.eq("status", filters.status.toLowerCase());
        }
        const { data, error } = await q;
        if (error || !data)
            return [];
        let results = data;
        if (filters?.search) {
            const queryStr = filters.search.toLowerCase();
            results = results.filter((o) => o.id.toLowerCase().includes(queryStr) ||
                (o.delivery_address_snapshot?.full_name || "").toLowerCase().includes(queryStr));
        }
        return results;
    }
    async updateOrderStatus(orderId, status) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("orders")
            .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
            .eq("id", orderId);
        return !error;
    }
    async createOrder(orderPayload, lineItems, fulfillments) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: order, error: orderErr } = await db
            .from("orders")
            .insert(orderPayload)
            .select("id")
            .single();
        if (orderErr || !order) {
            throw new Error(`Order insertion failed: ${orderErr?.message}`);
        }
        const orderId = order.id;
        const itemsWithOrderId = lineItems.map((li) => ({ ...li, order_id: orderId }));
        const { error: itemsErr } = await db.from("order_items").insert(itemsWithOrderId);
        if (itemsErr) {
            await db.from("orders").delete().eq("id", orderId);
            throw new Error(`Order items insertion failed: ${itemsErr.message}`);
        }
        const fulfillmentsWithOrderId = fulfillments.map((f) => ({ ...f, order_id: orderId }));
        await db.from("seller_order_fulfillments").insert(fulfillmentsWithOrderId);
        return orderId;
    }
}
exports.OrderRepository = OrderRepository;
exports.orderRepository = new OrderRepository();
