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
    return data;
  }

  async findByOrderAndSeller(orderId: string, sellerId: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("seller_order_fulfillments")
      .select("*")
      .eq("order_id", orderId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async updateFulfillmentStatus(
    fulfillmentId: string,
    sellerId: string,
    newStatus: string,
    timestampField?: string
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
