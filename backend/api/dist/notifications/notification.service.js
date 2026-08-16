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
        return notification_repository_js_1.notificationRepository.createNotification(dto);
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
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
