"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Notifications Routes
const express_1 = require("express");
const notifications_controller_js_1 = require("./notifications.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const notifications_sse_js_1 = require("./notifications.sse.js");
const router = (0, express_1.Router)();
router.get("/stream", auth_js_1.authenticateToken, notifications_sse_js_1.streamNotifications);
router.get("/", auth_js_1.authenticateToken, notifications_controller_js_1.notificationsController.getNotifications);
router.get("/unread-count", auth_js_1.authenticateToken, notifications_controller_js_1.notificationsController.getUnreadCount);
router.patch("/:id/read", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, notifications_controller_js_1.notificationsController.markAsRead);
router.patch("/read-all", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, notifications_controller_js_1.notificationsController.markAllAsRead);
router.delete("/:id", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, notifications_controller_js_1.notificationsController.deleteNotification);
exports.default = router;
