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

  async updateProfile(
    userId: string,
    updates: { full_name?: string; phone?: string },
  ): Promise<UserProfile | null> {
    return this.updateUser(userId, updates);
  }

  async updateUser(
    userId: string,
    updates: { full_name?: string; phone?: string; role?: UserRole },
  ): Promise<UserProfile | null> {
    const db = getAdminDb();
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.role !== undefined) payload.role = updates.role;

    const { data, error } = await db
      .from("user_profiles")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error || !data) return null;

    if (updates.role === "seller") {
      const { data: existingSeller } = await db
        .from("seller_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingSeller) {
        await db.from("seller_profiles").insert({
          user_id: userId,
          business_name: data.full_name || "Nursery Partner",
          business_description: "Role assigned by Admin",
          contact_email: "",
          contact_phone: data.phone || "",
          address: "",
          status: "approved",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return data as UserProfile;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const db = getAdminDb();
    const { error } = await db.from("user_profiles").delete().eq("id", userId);
    return !error;
  }
}

export const userRepository = new UserRepository();
