// Floria API — Centralized Notification Service
import {
  notificationRepository,
  CreateNotificationDto
} from "../database/repositories/notification.repository.js";
import { Errors } from "../utils/errors.js";

export class NotificationService {
  async createNotification(dto: CreateNotificationDto) {
    if (!dto.user_id || !dto.title || !dto.message || !dto.type) {
      throw Errors.validation("Missing required notification fields");
    }
    return notificationRepository.createNotification(dto);
  }

  async getUserNotifications(
    userId: string,
    params: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    return notificationRepository.findByUserId(userId, params);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await notificationRepository.markAsRead(userId, notificationId);
    if (!notification) {
      throw Errors.notFound("Notification");
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
