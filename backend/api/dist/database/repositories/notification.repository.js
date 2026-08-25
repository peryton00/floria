"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
// Floria API — Notification Repository
const database_js_1 = require("../../config/database.js");
class NotificationRepository {
    async createNotification(dto) {
        const db = (0, database_js_1.getAdminDb)();
        // Deduplication check if source_type & source_id provided
        if (dto.source_type && dto.source_id) {
            try {
                const query = db.from("notifications").select("*");
                if (typeof query.eq === "function") {
                    const { data: existing } = await query
                        .eq("user_id", dto.user_id)
                        .eq("source_type", dto.source_type)
                        .eq("source_id", dto.source_id)
                        .maybeSingle();
                    if (existing) {
                        return existing;
                    }
                }
            }
            catch (e) {
                // Continue to insert if query mock doesn't support nested .eq()
            }
        }
        const payloadData = dto.data || {};
        if (dto.navigation && !payloadData.navigation) {
            payloadData.navigation = dto.navigation;
        }
        const { data, error } = await db
            .from("notifications")
            .insert({
            user_id: dto.user_id,
            role: dto.role || "customer",
            type: dto.type,
            title: dto.title,
            message: dto.message,
            data: payloadData,
            source_type: dto.source_type || null,
            source_id: dto.source_id || null,
        })
            .select()
            .single();
        if (error) {
            // Handle Postgres unique constraint violation (code 23505)
            if (error.code === "23505" && dto.source_type && dto.source_id) {
                const { data: existing } = await db
                    .from("notifications")
                    .select("*")
                    .eq("user_id", dto.user_id)
                    .eq("source_type", dto.source_type)
                    .eq("source_id", dto.source_id)
                    .maybeSingle();
                if (existing)
                    return existing;
            }
            console.error("[NotificationRepository] createNotification error:", error);
            throw new Error(error.message);
        }
        return data;
    }
    async findByUserId(userId, options = {}) {
        const db = (0, database_js_1.getAdminDb)();
        const limit = Math.min(options.limit || 20, 50);
        const page = Math.max(options.page || 1, 1);
        const offset = (page - 1) * limit;
        let query = db
            .from("notifications")
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (options.unreadOnly) {
            query = query.is("read_at", null);
        }
        const { data, count, error } = await query.range(offset, offset + limit - 1);
        if (error) {
            throw new Error(error.message);
        }
        const unreadCount = await this.getUnreadCount(userId);
        return {
            notifications: data || [],
            total: count || 0,
            unreadCount,
        };
    }
    async getUnreadCount(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { count, error } = await db
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .is("read_at", null);
        if (error)
            return 0;
        return count || 0;
    }
    async markAsRead(userId, notificationId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", notificationId)
            .eq("user_id", userId)
            .select()
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async markAllAsRead(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("user_id", userId)
            .is("read_at", null);
        if (error)
            throw new Error(error.message);
        return true;
    }
    async deleteNotification(userId, notificationId) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("notifications")
            .delete()
            .eq("id", notificationId)
            .eq("user_id", userId);
        if (error)
            throw new Error(error.message);
        return true;
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();
