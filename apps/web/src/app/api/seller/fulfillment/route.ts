// Floria — Secure Seller Fulfillment API Route
// POST /api/seller/fulfillment
//
// Flow:
//   requireSeller()
//   → derive sellerId from auth.uid() → seller_profiles (NEVER from body)
//   → validate masterOrderId (UUID)
//   → load fulfillment record WHERE order_id AND seller_id = our seller (ownership enforced)
//   → validateSellerStatusTransition(current, next)
//   → update seller_order_fulfillments
//   → auditLog(SELLER_FULFILLMENT_CHANGED)
//   → return { status }

import "server-only";

import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/server/auth";
import { validateUuid } from "@/lib/server/validate";
import { rateLimitSellerFulfillment } from "@/lib/server/rate-limit";
import { auditLog } from "@/lib/server/audit";
import { Errors } from "@/lib/server/errors";
import { ok, handleRoute } from "@/lib/server/response";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const SELLER_STAGES = [
  "Order Placed",
  "Nursery Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
] as const;

type SellerStage = (typeof SELLER_STAGES)[number];

function isSellerStage(s: unknown): s is SellerStage {
  return SELLER_STAGES.includes(s as SellerStage);
}

function validateTransition(current: SellerStage, next: SellerStage): void {
  const ci = SELLER_STAGES.indexOf(current);
  const ni = SELLER_STAGES.indexOf(next);
  if (ni !== ci + 1) {
    throw Errors.invalidTransition(current, next);
  }
}

// Timestamp columns to set based on new status
const STATUS_TIMESTAMP_COLS: Partial<Record<SellerStage, string>> = {
  "Nursery Confirmed": "confirmed_at",
  Preparing: "preparing_at",
  "Ready for Pickup": "ready_at",
  "Picked Up": "picked_up_at",
};

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    // 1. Auth + rate limit
    //    sellerId comes from auth.uid() → seller_profiles — NEVER from request body
    const seller = await requireSeller();
    rateLimitSellerFulfillment(seller.sellerId);

    // 2. Parse body — only accept masterOrderId and newStatus from browser
    const body = await req.json().catch(() => ({}));
    const masterOrderId = validateUuid(body.masterOrderId, "masterOrderId");

    const newStatus = body.newStatus;
    if (!isSellerStage(newStatus)) {
      throw Errors.validation(
        `newStatus must be one of: ${SELLER_STAGES.join(", ")}.`,
      );
    }

    // 3. Load the fulfillment record for this seller + order
    //    The WHERE clause enforces ownership — seller cannot update another seller's fulfillment
    const supabase = await getSupabaseServerClient();
    const { data: fulfillment, error: fetchErr } = await supabase
      .from("seller_order_fulfillments")
      .select("id, status")
      .eq("order_id", masterOrderId)
      .eq("seller_id", seller.sellerId) // ownership enforced here
      .maybeSingle();

    if (fetchErr) {
      console.error("[fulfillment] Fetch error:", fetchErr.message);
      throw Errors.database();
    }

    if (!fulfillment) {
      // Return 404 without revealing whether the order exists for another seller (IDOR prevention)
      throw Errors.notFound("Fulfillment record");
    }

    const currentStatus = fulfillment.status as SellerStage;

    // 4. Validate sequential transition
    validateTransition(currentStatus, newStatus);

    // 5. Update fulfillment record
    const timestampCol = STATUS_TIMESTAMP_COLS[newStatus];
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (timestampCol) {
      updatePayload[timestampCol] = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from("seller_order_fulfillments")
      .update(updatePayload)
      .eq("id", fulfillment.id)
      .eq("seller_id", seller.sellerId); // double-check ownership on update

    if (updateErr) {
      console.error("[fulfillment] Update error:", updateErr.message);
      throw Errors.database();
    }

    // 6. Audit log (fire-and-forget)
    void auditLog({
      actor_user_id: seller.id,
      actor_role: "seller",
      action: "SELLER_FULFILLMENT_CHANGED",
      resource_type: "seller_order_fulfillment",
      resource_id: fulfillment.id as string,
      metadata: {
        order_id: masterOrderId,
        seller_id: seller.sellerId,
        from_status: currentStatus,
        to_status: newStatus,
      },
    });

    return ok({ status: newStatus, orderId: masterOrderId });
  });
}
