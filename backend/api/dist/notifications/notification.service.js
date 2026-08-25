"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
// Floria API — Centralized Notification Service
const notification_repository_js_1 = require("../database/repositories/notification.repository.js");
const errors_js_1 = require("../utils/errors.js");
class NotificationService {
    async createNotification(dto) {
        if (!dto.user_id || !dto.title || !dto.message || !dto.type) {
            throw errors_js_1.Errors.validation("Missing required notification fields");
        }
        const created = await notification_repository_js_1.notificationRepository.createNotification(dto);
        // Publish realtime event to Redis channel floria:notifications:<user_id>
        try {
            const { getRedisClient } = await import("../config/redis.js");
            const redis = getRedisClient();
            const channel = `floria:notifications:${dto.user_id}`;
            const payload = JSON.stringify({
                event: "notification.created",
                notificationId: created.id,
                userId: created.user_id,
                type: created.type,
                title: created.title,
                message: created.message,
                createdAt: created.created_at || new Date().toISOString(),
                navigation: created.data?.navigation || dto.navigation || null,
                data: created.data || {},
            });
            await redis.publish(channel, payload);
        }
        catch (redisErr) {
            // Redis publishing failure MUST NOT break PostgreSQL notification persistence
            console.warn("[NotificationService] Redis publish event failed:", redisErr?.message);
        }
        return created;
    }
    async getUserNotifications(userId, params = {}) {
        return notification_repository_js_1.notificationRepository.findByUserId(userId, params);
    }
    async getUnreadCount(userId) {
        return notification_repository_js_1.notificationRepository.getUnreadCount(userId);
    }
    async markAsRead(userId, notificationId) {
        const notification = await notification_repository_js_1.notificationRepository.markAsRead(userId, notificationId);
        if (!notification) {
            throw errors_js_1.Errors.notFound("Notification");
        }
        return notification;
    }
    async markAllAsRead(userId) {
        return notification_repository_js_1.notificationRepository.markAllAsRead(userId);
    }
    async deleteNotification(userId, notificationId) {
        return notification_repository_js_1.notificationRepository.deleteNotification(userId, notificationId);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
