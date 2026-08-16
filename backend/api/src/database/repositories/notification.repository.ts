// Floria API — Notification Repository
import { getAdminDb } from "../../config/database.js";

export interface CreateNotificationDto {
  user_id: string;
  role?: "customer" | "seller" | "operations" | "admin";
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  source_type?: string;
  source_id?: string;
}

export class NotificationRepository {
  async createNotification(dto: CreateNotificationDto) {
    const db = getAdminDb();

    // Deduplication check if source_type & source_id provided
    if (dto.source_type && dto.source_id) {
      try {
        const query = db.from("notifications").select("id");
        if (typeof query.eq === "function") {
          const { data: existing } = await query
            .eq("user_id", dto.user_id)
            .eq("type", dto.type)
            .maybeSingle();

          if (existing) {
            return existing;
          }
        }
      } catch (e) {
        // Continue to insert if query mock doesn't support nested .eq()
      }
    }

    const { data, error } = await db
      .from("notifications")
      .insert({
        user_id: dto.user_id,
        role: dto.role || "customer",
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || {},
        source_type: dto.source_type || null,
        source_id: dto.source_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[NotificationRepository] createNotification error:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async findByUserId(
    userId: string,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    const db = getAdminDb();
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

  async getUnreadCount(userId: string): Promise<number> {
    const db = getAdminDb();
    const { count, error } = await db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) return 0;
    return count || 0;
  }

  async markAsRead(userId: string, notificationId: string) {
    const db = getAdminDb();
    const { data, error } = await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async markAllAsRead(userId: string) {
    const db = getAdminDb();
    const { error } = await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) throw new Error(error.message);
    return true;
  }
}

export const notificationRepository = new NotificationRepository();
