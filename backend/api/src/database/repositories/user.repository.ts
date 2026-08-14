// Floria API — User Profile Repository
import { getAdminDb } from "../../config/database.js";
import type { UserProfile, UserRole } from "@floria/types";

export class UserRepository {
  async findById(userId: string): Promise<UserProfile | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as UserProfile;
  }

  async findAll(limit = 50, offset = 0): Promise<UserProfile[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("user_profiles")
      .select("*")
      .range(offset, offset + limit - 1);

    if (error || !data) return [];
    return data as UserProfile[];
  }

  async updateRole(userId: string, newRole: UserRole): Promise<boolean> {
    const db = getAdminDb();
    const { error } = await db
      .from("user_profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    return !error;
  }

  async updateProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<UserProfile | null> {
    const db = getAdminDb();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.phone !== undefined) payload.phone = updates.phone;

    const { data, error } = await db
      .from("user_profiles")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error || !data) return null;
    return data as UserProfile;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const db = getAdminDb();
    const { error } = await db.from("user_profiles").delete().eq("id", userId);
    return !error;
  }
}

export const userRepository = new UserRepository();
