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
    const created = await notificationRepository.createNotification(dto);

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
    } catch (redisErr: any) {
      // Redis publishing failure MUST NOT break PostgreSQL notification persistence
      console.warn("[NotificationService] Redis publish event failed:", redisErr?.message);
    }

    return created;
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

  async deleteNotification(userId: string, notificationId: string) {
    return notificationRepository.deleteNotification(userId, notificationId);
  }
}

export const notificationService = new NotificationService();
