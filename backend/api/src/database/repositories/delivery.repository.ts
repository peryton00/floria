// Floria API — Delivery Assignments Repository
import { getAdminDb } from "../../config/database.js";

export interface CreateDeliveryInput {
  order_id: string;
  assigned_to: string;
  status?: string;
}

export class DeliveryRepository {
  async findAll(status?: string): Promise<any[]> {
    const db = getAdminDb();
    let q = db
      .from("delivery_assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (status && status !== "all") {
      q = q.eq("status", status);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data;
  }

  async findById(id: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_assignments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async assign(input: CreateDeliveryInput): Promise<any> {
    const db = getAdminDb();
    const now = new Date().toISOString();
    const payload = {
      order_id: input.order_id,
      assigned_to: input.assigned_to,
      status: input.status || "assigned",
      assigned_at: now,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await db
      .from("delivery_assignments")
      .insert(payload)
      .select()
      .single();

    if (error || !data) throw error || new Error("Failed to assign delivery");
    return data;
  }

  async updateStatus(id: string, newStatus: string): Promise<any | null> {
    const db = getAdminDb();
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    if (newStatus === "picked_up") payload["picked_up_at"] = now;
    if (newStatus === "out_for_delivery") payload["out_for_delivery_at"] = now;
    if (newStatus === "delivered") payload["delivered_at"] = now;

    const { data, error } = await db
      .from("delivery_assignments")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async completeWithPod(
    id: string,
    podAssetId: string,
    recipientName?: string,
    notes?: string,
  ): Promise<any | null> {
    const db = getAdminDb();
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      status: "delivered",
      delivered_at: now,
      pod_asset_id: podAssetId,
      recipient_name: recipientName || null,
      pod_notes: notes || null,
      updated_at: now,
    };

    const { data, error } = await db
      .from("delivery_assignments")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }
}

export const deliveryRepository = new DeliveryRepository();
