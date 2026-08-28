"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryRepository = exports.DeliveryRepository = void 0;
// Floria API — Delivery Assignments Repository
const database_js_1 = require("../../config/database.js");
class DeliveryRepository {
    async findAll(status) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db.from("delivery_assignments").select("*").order("created_at", { ascending: false });
        if (status && status !== "all") {
            q = q.eq("status", status);
        }
        const { data, error } = await q;
        if (error || !data)
            return [];
        return data;
    }
    async findById(id) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("delivery_assignments")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async assign(input) {
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        const payload = {
            order_id: input.order_id,
            assigned_to: input.assigned_to,
            status: input.status || "assigned",
            assigned_at: now,
            created_at: now,
            updated_at: now,
        };
        const { data, error } = await db
            .from("delivery_assignments")
            .insert(payload)
            .select()
            .single();
        if (error || !data)
            throw error || new Error("Failed to assign delivery");
        return data;
    }
    async updateStatus(id, newStatus) {
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        const payload = {
            status: newStatus,
            updated_at: now,
        };
        if (newStatus === "picked_up")
            payload["picked_up_at"] = now;
        if (newStatus === "out_for_delivery")
            payload["out_for_delivery_at"] = now;
        if (newStatus === "delivered")
            payload["delivered_at"] = now;
        const { data, error } = await db
            .from("delivery_assignments")
            .update(payload)
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async completeWithPod(id, podAssetId, recipientName, notes) {
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        const payload = {
            status: "delivered",
            delivered_at: now,
            pod_asset_id: podAssetId,
            recipient_name: recipientName || null,
            pod_notes: notes || null,
            updated_at: now,
        };
        const { data, error } = await db
            .from("delivery_assignments")
            .update(payload)
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
}
exports.DeliveryRepository = DeliveryRepository;
exports.deliveryRepository = new DeliveryRepository();
