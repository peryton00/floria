// Floria API — Delivery Partner Dedicated Repository
import { getAdminDb } from "../../config/database.js";
import type {
  DeliveryPartnerApplication,
  DeliveryPartner,
  DeliveryPartnerStatus,
  DeliveryApplicationStatus,
  DeliveryEarning,
  DeliveryPayout,
} from "@floria/types";

export class DeliveryPartnerRepository {
  // ── Applications ──────────────────────────────────────────────────────────

  async createApplication(data: {
    full_name: string;
    email: string;
    phone: string;
    city: string;
    vehicle_type: string;
    vehicle_number: string;
    driving_license: string;
    password_hash?: string;
    password_salt?: string;
    user_id?: string;
    submitted_documents?: any[];
  }): Promise<DeliveryPartnerApplication> {
    const db = getAdminDb();
    const payload: any = {
      full_name: data.full_name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      city: data.city.trim(),
      vehicle_type: data.vehicle_type,
      vehicle_number: data.vehicle_number.toUpperCase().trim(),
      driving_license: data.driving_license.toUpperCase().trim(),
      password_hash: data.password_hash || null,
      password_salt: data.password_salt || null,
      user_id: data.user_id || null,
      submitted_documents: data.submitted_documents || [],
      status: "pending",
      submitted_at: new Date().toISOString(),
    };

    const { data: row, error } = await db
      .from("delivery_partner_applications")
      .insert(payload)
      .select()
      .single();

    if (error || !row) throw error || new Error("Failed to create application");
    return row as DeliveryPartnerApplication;
  }

  async findApplicationById(id: string): Promise<DeliveryPartnerApplication | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartnerApplication;
  }

  async findApplicationByEmail(email: string): Promise<DeliveryPartnerApplication | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_applications")
      .select("*")
      .ilike("email", email.toLowerCase().trim())
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartnerApplication;
  }

  async findApplications(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DeliveryPartnerApplication[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_partner_applications")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase().trim();
      q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
    }

    if (filters?.limit) {
      q = q.limit(filters.limit);
    }
    if (filters?.offset) {
      q = q.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data as DeliveryPartnerApplication[];
  }

  async updateApplication(
    id: string,
    updates: Partial<DeliveryPartnerApplication>,
  ): Promise<DeliveryPartnerApplication | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_applications")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartnerApplication;
  }

  // ── Partners ──────────────────────────────────────────────────────────────

  async createPartner(data: {
    user_id?: string | null;
    public_partner_id: string;
    full_name: string;
    email: string;
    phone: string;
    city: string;
    vehicle_type: string;
    vehicle_number: string;
    driving_license: string;
    status?: DeliveryPartnerStatus;
  }): Promise<DeliveryPartner> {
    const db = getAdminDb();
    const payload = {
      user_id: data.user_id || null,
      public_partner_id: data.public_partner_id,
      full_name: data.full_name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      city: data.city.trim(),
      vehicle_type: data.vehicle_type,
      vehicle_number: data.vehicle_number.toUpperCase().trim(),
      driving_license: data.driving_license.toUpperCase().trim(),
      status: data.status || "active",
      on_duty: false,
    };

    const { data: row, error } = await db
      .from("delivery_partners")
      .insert(payload)
      .select()
      .single();

    if (error || !row) throw error || new Error("Failed to create delivery partner");
    return row as DeliveryPartner;
  }

  async findPartnerById(id: string): Promise<DeliveryPartner | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partners")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartner;
  }

  async findPartnerByUserId(userId: string): Promise<DeliveryPartner | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partners")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartner;
  }

  async findPartnerByEmail(email: string): Promise<DeliveryPartner | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partners")
      .select("*")
      .ilike("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartner;
  }

  async findPartnerByPublicId(publicId: string): Promise<DeliveryPartner | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partners")
      .select("*")
      .ilike("public_partner_id", publicId.trim())
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartner;
  }

  async findCredentialsByPartnerId(partnerId: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_credentials")
      .select("*")
      .eq("partner_id", partnerId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async findPartners(filters?: {
    status?: string;
    on_duty?: boolean;
    search?: string;
  }): Promise<DeliveryPartner[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }
    if (filters?.on_duty !== undefined) {
      q = q.eq("on_duty", filters.on_duty);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase().trim();
      q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,public_partner_id.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data as DeliveryPartner[];
  }

  async updatePartner(
    id: string,
    updates: Partial<DeliveryPartner>,
  ): Promise<DeliveryPartner | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partners")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as DeliveryPartner;
  }

  // ── Credentials & Activation ──────────────────────────────────────────────

  async createCredential(data: {
    partner_id: string;
    user_id?: string | null;
    email: string;
    password_hash?: string | null;
    password_salt?: string | null;
    password_algo?: string;
    activation_token_hash?: string | null;
    activation_expires_at?: string | null;
    is_activated?: boolean;
    public_partner_id: string;
  }): Promise<any> {
    const db = getAdminDb();
    const { data: row, error } = await db
      .from("delivery_partner_credentials")
      .insert(data)
      .select()
      .single();

    if (error || !row) throw error || new Error("Failed to create credential");
    return row;
  }

  async findCredentialByTokenHash(tokenHash: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_credentials")
      .select("*")
      .eq("activation_token_hash", tokenHash)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async findCredentialByPartnerId(partnerId: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_credentials")
      .select("*")
      .eq("partner_id", partnerId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async updateCredential(partnerId: string, updates: any): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_credentials")
      .update(updates)
      .eq("partner_id", partnerId)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  // ── Password Resets ───────────────────────────────────────────────────────

  async createPasswordReset(
    partnerId: string,
    tokenHash: string,
    expiresAt: string,
  ): Promise<any> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_password_resets")
      .insert({
        partner_id: partnerId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error || !data) throw error || new Error("Failed to create reset token");
    return data;
  }

  async findPasswordResetByTokenHash(tokenHash: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_partner_password_resets")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async markPasswordResetUsed(id: string): Promise<boolean> {
    const db = getAdminDb();
    const { error } = await db
      .from("delivery_partner_password_resets")
      .update({ used_at: new Date().toISOString() })
      .eq("id", id);

    return !error;
  }

  // ── Deliveries (Scoped Courier Isolation) ─────────────────────────────────

  async findPartnerDeliveries(partnerId: string, status?: string): Promise<any[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_assignments")
      .select("*")
      .or(`delivery_partner_id.eq.${partnerId},assigned_to.eq.${partnerId}`)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      q = q.eq("status", status);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data;
  }

  // ── Earnings Ledger ───────────────────────────────────────────────────────

  async createEarning(data: {
    partner_id: string;
    delivery_id: string;
    order_id: string;
    base_earning_paise: number;
    extra_items_earning_paise: number;
    total_earning_paise: number;
    status?: string;
    metadata?: any;
  }): Promise<DeliveryEarning> {
    const db = getAdminDb();
    const payload = {
      partner_id: data.partner_id,
      delivery_id: data.delivery_id,
      order_id: data.order_id,
      base_earning_paise: data.base_earning_paise,
      extra_items_earning_paise: data.extra_items_earning_paise,
      total_earning_paise: data.total_earning_paise,
      status: data.status || "available",
      metadata: data.metadata || {},
    };

    const { data: row, error } = await db
      .from("delivery_earnings")
      .insert(payload)
      .select()
      .single();

    if (error || !row) throw error || new Error("Failed to create earning record");
    return row as DeliveryEarning;
  }

  async findEarningsByPartnerId(
    partnerId: string,
    filters?: { status?: string },
  ): Promise<DeliveryEarning[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_earnings")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data as DeliveryEarning[];
  }

  async findEarnings(filters?: {
    partner_id?: string;
    status?: string;
  }): Promise<DeliveryEarning[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_earnings")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.partner_id) {
      q = q.eq("partner_id", filters.partner_id);
    }
    if (filters?.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data as DeliveryEarning[];
  }

  async findPayouts(filters?: { partner_id?: string }): Promise<DeliveryPayout[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_payouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.partner_id) {
      q = q.eq("partner_id", filters.partner_id);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data as DeliveryPayout[];
  }
}

export const deliveryPartnerRepository = new DeliveryPartnerRepository();
