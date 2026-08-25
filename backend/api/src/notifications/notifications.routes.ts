// Floria API — Notifications Routes
import { Router } from "express";
import { notificationsController } from "./notifications.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { sellerFulfillmentRateLimiter } from "../middleware/rateLimit.js";

import { streamNotifications } from "./notifications.sse.js";

const router = Router();

router.get("/stream", authenticateToken, streamNotifications);
router.get("/", authenticateToken, notificationsController.getNotifications);
router.get("/unread-count", authenticateToken, notificationsController.getUnreadCount);
router.patch("/:id/read", authenticateToken, sellerFulfillmentRateLimiter, notificationsController.markAsRead);
router.patch("/read-all", authenticateToken, sellerFulfillmentRateLimiter, notificationsController.markAllAsRead);
router.delete("/:id", authenticateToken, sellerFulfillmentRateLimiter, notificationsController.deleteNotification);

export default router;
