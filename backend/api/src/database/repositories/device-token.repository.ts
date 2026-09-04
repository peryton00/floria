// Floria API — Device Token Repository (P1 Push Notifications)
import { getAdminDb } from "../../config/database.js";
import type { DeviceToken, DevicePlatform } from "@floria/types";

export class DeviceTokenRepository {
  async registerToken(
    userId: string,
    token: string,
    platform: DevicePlatform = "android",
    partnerId?: string | null,
    deviceInfo?: Record<string, any>,
  ): Promise<DeviceToken> {
    const db = getAdminDb();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from("device_tokens")
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          partner_id: partnerId || null,
          device_info: deviceInfo || {},
          is_active: true,
          last_used_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,token" },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register device token: ${error.message}`);
    }

    return data;
  }

  async findActiveTokensByUserId(userId: string): Promise<DeviceToken[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("device_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("last_used_at", { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  }

  async findActiveTokensByPartnerId(partnerId: string): Promise<DeviceToken[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("device_tokens")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .order("last_used_at", { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  }

  async deactivateToken(token: string): Promise<void> {
    const db = getAdminDb();
    await db
      .from("device_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("token", token);
  }

  async removeToken(userId: string, token: string): Promise<void> {
    const db = getAdminDb();
    await db
      .from("device_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);
  }
}

export const deviceTokenRepository = new DeviceTokenRepository();
