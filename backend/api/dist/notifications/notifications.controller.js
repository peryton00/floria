"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = exports.NotificationsController = void 0;
const notification_service_js_1 = require("./notification.service.js");
class NotificationsController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : 20;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const unreadOnly = req.query.unreadOnly === "true";
            const data = await notification_service_js_1.notificationService.getUserNotifications(userId, {
                limit,
                page,
                unreadOnly,
            });
            res.json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const unreadCount = await notification_service_js_1.notificationService.getUnreadCount(userId);
            res.json({ success: true, data: { unreadCount } });
        }
        catch (err) {
            next(err);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const notificationId = req.params.id;
            const data = await notification_service_js_1.notificationService.markAsRead(userId, notificationId);
            res.json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            await notification_service_js_1.notificationService.markAllAsRead(userId);
            res.json({
                success: true,
                data: { message: "All notifications marked as read" },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteNotification(req, res, next) {
        try {
            const userId = req.user.id;
            const notificationId = req.params.id;
            await notification_service_js_1.notificationService.deleteNotification(userId, notificationId);
            res.json({ success: true, data: { message: "Notification deleted" } });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationsController = NotificationsController;
exports.notificationsController = new NotificationsController();
