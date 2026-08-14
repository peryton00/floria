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
  "Preparing": "preparing_at",
  "Ready for Pickup": "ready_at",
  "Picked Up": "picked_up_at",
};

export class FulfillmentService {
  async getSellerFulfillments(sellerId: string) {
    return fulfillmentRepository.findBySellerId(sellerId);
  }

  async updateStatus(actorUserId: string, sellerId: string, masterOrderId: string, newStatus: string) {
    if (!SELLER_STAGES.includes(newStatus as SellerStage)) {
      throw Errors.validation(`Invalid fulfillment status: ${newStatus}`);
    }

    const record = await fulfillmentRepository.findByOrderAndSeller(masterOrderId, sellerId);
    if (!record) {
      // IDOR protection: throw 404 (do not reveal if order exists for another seller)
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
      tsCol
    );

    if (!success) throw Errors.database("Failed to update fulfillment status.");

    await auditRepository.log({
      actor_user_id: actorUserId,
      actor_role: "seller",
      action: "SELLER_FULFILLMENT_CHANGED",
      resource_type: "seller_order_fulfillment",
      resource_id: record.id,
      metadata: { order_id: masterOrderId, seller_id: sellerId, from: currentStatus, to: newStatus },
    });

    return { status: newStatus, orderId: masterOrderId };
  }
}

export const fulfillmentService = new FulfillmentService();
