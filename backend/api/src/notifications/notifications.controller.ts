// Floria API — Notifications Controller
import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service.js";

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const unreadOnly = req.query.unreadOnly === "true";

      const data = await notificationService.getUserNotifications(userId, {
        limit,
        page,
        unreadOnly,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const unreadCount = await notificationService.getUnreadCount(userId);
      res.json({ success: true, data: { unreadCount } });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id as string;
      const data = await notificationService.markAsRead(userId, notificationId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true, data: { message: "All notifications marked as read" } });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id as string;
      await notificationService.deleteNotification(userId, notificationId);
      res.json({ success: true, data: { message: "Notification deleted" } });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
