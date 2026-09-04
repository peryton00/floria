// Floria API — User Profile Repository
import { getAdminDb, getDbForUser } from "../../config/database.js";
import type { UserProfile, UserRole } from "@floria/types";

export class UserRepository {
  async findById(userId: string, token?: string): Promise<UserProfile | null> {
    const db = getDbForUser(token);
    const { data, error } = await db
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;

    // Fallback: enrich with auth.users email if not directly in user_profiles
    if (!data.email) {
      try {
        const adminDb = getAdminDb();
        const { data: authUser } = await adminDb.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          data.email = authUser.user.email;
        }
      } catch {
        // graceful fallback
      }
    }

    return data as UserProfile;
  }

  async findAll(
    limit = 50,
    offset = 0,
    filters?: { role?: string; search?: string; page?: number },
  ): Promise<UserProfile[]> {
    const db = getAdminDb();
    let q = db
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.role && filters.role !== "all") {
      q = q.eq("role", filters.role);
    }
    if (filters?.search) {
      q = q.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
      );
    }

    const calcOffset =
      filters?.page && filters.page > 1 ? (filters.page - 1) * limit : offset;
    q = q.range(calcOffset, calcOffset + limit - 1);

    const { data, error } = await q;
    if (error || !data) return [];

    // Fallback: enrich records missing email from auth.admin
    const missingEmail = (data as any[]).some((u) => !u.email);
    if (missingEmail) {
      try {
        const { data: authUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
        if (authUsers?.users) {
          const emailMap = new Map(authUsers.users.map((au) => [au.id, au.email]));
          for (const u of data as any[]) {
            if (!u.email && emailMap.has(u.id)) {
              u.email = emailMap.get(u.id) || null;
            }
          }
        }
      } catch {
        // graceful fallback
      }
    }

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
    token?: string,
  ): Promise<UserProfile | null> {
    return this.updateUser(userId, updates, token);
  }

  async updateUser(
    userId: string,
    updates: { full_name?: string; phone?: string; role?: UserRole },
    token?: string,
  ): Promise<UserProfile | null> {
    const db = getDbForUser(token);
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
        const generatedPublicId = `FLR-SLR-${userId.replace(/-/g, "").substring(0, 8).toUpperCase()}`;
        await db.from("seller_profiles").insert({
          user_id: userId,
          public_seller_id: generatedPublicId,
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
