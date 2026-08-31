// Floria API — Seller Fulfillment Repository
import { getAdminDb } from "../../config/database.js";

export class FulfillmentRepository {
  async findBySellerId(sellerId: string): Promise<any[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("seller_order_fulfillments")
      .select("*, orders(*)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.filter(
      (f: any) =>
        f.status !== "pending_payment" &&
        f.status !== "cancelled" &&
        (!f.orders || f.orders.status !== "pending_payment"),
    );
  }

  async findByOrderAndSeller(
    orderId: string,
    sellerId: string,
  ): Promise<any | null> {
    const db = getAdminDb();

    // Check direct match on seller_id
    const { data, error } = await db
      .from("seller_order_fulfillments")
      .select("*")
      .eq("order_id", orderId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (!error && data) return data;

    // Check if sellerId is a profile ID with an associated user_id, or vice-versa
    const { data: prof } = await db
      .from("seller_profiles")
      .select("id, user_id")
      .or(`id.eq.${sellerId},user_id.eq.${sellerId}`)
      .maybeSingle();

    if (prof) {
      const altId = prof.id === sellerId ? prof.user_id : prof.id;
      if (altId) {
        const { data: altData } = await db
          .from("seller_order_fulfillments")
          .select("*")
          .eq("order_id", orderId)
          .eq("seller_id", altId)
          .maybeSingle();

        if (altData) return altData;
      }
    }

    return null;
  }

  async updateFulfillmentStatus(
    fulfillmentId: string,
    sellerId: string,
    newStatus: string,
    timestampField?: string,
  ): Promise<boolean> {
    const db = getAdminDb();
    const payload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (timestampField) {
      payload[timestampField] = new Date().toISOString();
    }

    const { error } = await db
      .from("seller_order_fulfillments")
      .update(payload)
      .eq("id", fulfillmentId)
      .eq("seller_id", sellerId);

    return !error;
  }
}

export const fulfillmentRepository = new FulfillmentRepository();
