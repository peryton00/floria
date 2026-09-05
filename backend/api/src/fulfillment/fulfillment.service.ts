// Floria API — Seller Fulfillment Service
import { fulfillmentRepository } from "../database/repositories/fulfillment.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";

const SELLER_STAGES = [
  "Order Placed",
  "Nursery Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
] as const;

type SellerStage = (typeof SELLER_STAGES)[number];

const TIMESTAMP_COLS: Record<string, string> = {
  "Nursery Confirmed": "confirmed_at",
  Preparing: "preparing_at",
  "Ready for Pickup": "ready_at",
  "Picked Up": "picked_up_at",
};

export class FulfillmentService {
  async getSellerFulfillments(sellerId: string) {
    return fulfillmentRepository.findBySellerId(sellerId);
  }

  async updateStatus(
    actorUserId: string,
    sellerId: string,
    masterOrderId: string,
    newStatus: string,
  ) {
    if (!SELLER_STAGES.includes(newStatus as SellerStage)) {
      throw Errors.validation(`Invalid fulfillment status: ${newStatus}`);
    }

    let record = await fulfillmentRepository.findByOrderAndSeller(
      masterOrderId,
      sellerId,
    );
    if (!record) {
      const { getAdminDb } = await import("../config/database.js");
      const db = getAdminDb();

      let targetSellerId = sellerId;
      let targetUserId = sellerId;
      try {
        const { data: prof } = await db
          .from("seller_profiles")
          .select("id, user_id")
          .or(`id.eq.${sellerId},user_id.eq.${sellerId}`)
          .maybeSingle();
        if (prof) {
          targetSellerId = prof.id || sellerId;
          targetUserId = prof.user_id || sellerId;
        }
      } catch {}

      // 1. Check if master order exists
      const { data: order } = await db
        .from("orders")
        .select("id, status, seller_id")
        .eq("id", masterOrderId)
        .maybeSingle();

      if (!order) {
        // IDOR protection: throw 404 if order does not exist at all
        throw Errors.notFound("Fulfillment record");
      }

      // 2. IDOR protection: Verify calling seller has items in this order
      const { data: items } = await db
        .from("order_items")
        .select("id, seller_id_snapshot, product:products(seller_id)")
        .eq("order_id", masterOrderId);

      const hasLegitimateItem = Array.isArray(items) && items.some((item: any) => {
        const snapshotMatch =
          item.seller_id_snapshot === targetSellerId ||
          item.seller_id_snapshot === targetUserId;
        const productSellerMatch =
          item.product?.seller_id === targetSellerId ||
          item.product?.seller_id === targetUserId;
        return snapshotMatch || productSellerMatch;
      });

      const isDirectOrderSeller =
        order.seller_id === targetSellerId ||
        order.seller_id === targetUserId;

      if (!hasLegitimateItem && !isDirectOrderSeller) {
        throw Errors.forbidden("You do not have items in this order.");
      }

      // Provision initial fulfillment record for this order & seller
      const { data: newRecord } = await db
        .from("seller_order_fulfillments")
        .insert({
          order_id: masterOrderId,
          seller_id: targetSellerId,
          status: "Order Placed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      record = newRecord;
    }

    if (!record) {
      throw Errors.notFound("Fulfillment record");
    }

    const currentStatus = record.status as SellerStage;
    const ci = SELLER_STAGES.indexOf(currentStatus);
    const ni = SELLER_STAGES.indexOf(newStatus as SellerStage);

    if (ni !== ci + 1) {
      throw Errors.invalidTransition(currentStatus, newStatus);
    }

    const tsCol = TIMESTAMP_COLS[newStatus];
    const success = await fulfillmentRepository.updateFulfillmentStatus(
      record.id,
      sellerId,
      newStatus,
      tsCol,
    );

    if (!success) throw Errors.database("Failed to update fulfillment status.");

    await auditRepository.log({
      actor_user_id: actorUserId,
      actor_role: "seller",
      action: "SELLER_FULFILLMENT_CHANGED",
      resource_type: "seller_order_fulfillment",
      resource_id: record.id,
      metadata: {
        order_id: masterOrderId,
        seller_id: sellerId,
        from: currentStatus,
        to: newStatus,
      },
    });

    return { status: newStatus, orderId: masterOrderId };
  }
}

export const fulfillmentService = new FulfillmentService();
