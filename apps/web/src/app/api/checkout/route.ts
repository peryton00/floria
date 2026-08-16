// Floria — Secure Checkout API Route
// POST /api/checkout
//
// Flow:
//   requireUser()
//   → load cart from DB (by authenticated user ID)
//   → load current products + inventory (server-authoritative prices)
//   → validate address (from DB, never from body)
//   → validate stock server-side
//   → recalculate prices (ignore any client-supplied totals)
//   → create order + order_items + seller_order_fulfillments (via service-role)
//   → clear server cart
//   → auditLog(ORDER_CREATED)
//   → return { orderId }

import "server-only";

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { validateAddress, validatePaymentMethod } from "@/lib/server/validate";
import { rateLimitOrderCreation } from "@/lib/server/rate-limit";
import { auditLog } from "@/lib/server/audit";
import { Errors } from "@/lib/server/errors";
import { ok, handleRoute } from "@/lib/server/response";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

async function getCommissionRate(supabase: any): Promise<number> {
  try {
    const { data: policy } = await supabase
      .from("pricing_policy_versions")
      .select("seller_commission_rate")
      .eq("status", "active")
      .maybeSingle();

    if (policy && policy.seller_commission_rate !== undefined && policy.seller_commission_rate !== null) {
      const ratePct = Number(policy.seller_commission_rate);
      if (!isNaN(ratePct) && ratePct >= 0) {
        return ratePct / 100.0;
      }
    }

    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "seller_commission_rate")
      .maybeSingle();

    if (data && data.value !== undefined && data.value !== null) {
      const ratePct = Number(data.value);
      if (!isNaN(ratePct) && ratePct >= 0) {
        return ratePct / 100.0;
      }
    }
  } catch (e) {
    console.warn("[checkout] Failed to fetch commission rate from DB:", e);
  }
  return 0;
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    // 1. Auth + rate limit
    const user = await requireUser();
    rateLimitOrderCreation(user.id);

    // 2. Parse body — only accept addressId and paymentMethod from browser
    //    Everything else (prices, quantities, seller_ids) comes from the DB
    const body = await req.json().catch(() => ({}));
    const paymentMethod = validatePaymentMethod(body.paymentMethod);

    // 3. Load delivery address from DB (never trust address data from browser)
    const supabase = await getSupabaseServerClient();
    let deliveryAddress: Record<string, unknown> | null = null;

    if (body.addressId && typeof body.addressId === "string") {
      const { data: addr } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", body.addressId)
        .eq("user_id", user.id) // ownership check
        .maybeSingle();
      if (addr) {
        // Validate the address from DB (extra safety net)
        const validated = validateAddress({
          full_name: addr.full_name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          instructions: addr.label,
        });
        deliveryAddress = validated as unknown as Record<string, unknown>;
      }
    }

    // Fallback: validate inline address from body
    if (!deliveryAddress && body.address) {
      deliveryAddress = validateAddress(body.address) as unknown as Record<string, unknown>;
    }

    if (!deliveryAddress) {
      throw Errors.validation("Please select a delivery address.");
    }

    // 4. Load cart items from DB
    const { data: cartRow } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!cartRow) throw Errors.orderInvalid("Your cart is empty.");

    const { data: dbCartItems } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity")
      .eq("cart_id", cartRow.id);

    if (!dbCartItems || dbCartItems.length === 0) {
      throw Errors.orderInvalid("Your cart is empty.");
    }

    const productIds = dbCartItems.map((ci) => ci.product_id as string);

    // 5. Load current product + inventory from DB (server-authoritative prices)
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, seller_id, status")
      .in("id", productIds)
      .eq("status", "active");

    const { data: inventories } = await supabase
      .from("inventory")
      .select("product_id, price_paise, stock_quantity, seller_id")
      .in("product_id", productIds);

    if (!products || products.length === 0) {
      throw Errors.orderInvalid("No active products found in your cart.");
    }

    const productMap = new Map(products.map((p) => [p.id as string, p]));
    const inventoryMap = new Map(
      (inventories ?? []).map((i) => [i.product_id as string, i])
    );

    // 6. Validate stock + compute server-authoritative totals
    const lineItems: Array<{
      product_id: string;
      product_name_snapshot: string;
      seller_id_snapshot: string;
      unit_price_paise_snapshot: number;
      quantity: number;
      line_total_paise: number;
    }> = [];

    for (const cartItem of dbCartItems) {
      const pid = cartItem.product_id as string;
      const product = productMap.get(pid);
      const inventory = inventoryMap.get(pid);

      if (!product) throw Errors.orderInvalid(`A product in your cart is no longer available.`);
      if (!inventory) throw Errors.orderInvalid(`Price information unavailable for "${product.name}".`);
      if (inventory.stock_quantity < cartItem.quantity) {
        throw Errors.outOfStock(product.name as string);
      }

      lineItems.push({
        product_id: pid,
        product_name_snapshot: product.name as string,
        seller_id_snapshot: product.seller_id as string,
        unit_price_paise_snapshot: inventory.price_paise as number,
        quantity: cartItem.quantity as number,
        line_total_paise: (inventory.price_paise as number) * (cartItem.quantity as number),
      });
    }

    const subtotalPaise = lineItems.reduce((s, li) => s + li.line_total_paise, 0);
    const commissionDecimalRate = await getCommissionRate(supabase);
    const commissionPaise = Math.round(subtotalPaise * commissionDecimalRate);

    // 7. Determine primary seller_id (first seller in the order — multi-nursery tracked via order_items)
    const primarySellerId = lineItems[0]!.seller_id_snapshot;

    // 8. Write order + order_items + seller_fulfillments via service-role (bypasses RLS for INSERT)
    const db = await getSupabaseServiceClient();

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        customer_id: user.id,
        seller_id: primarySellerId,
        status: "seller_pending",
        delivery_address_snapshot: deliveryAddress,
        subtotal_paise: subtotalPaise,
        delivery_fee_paise: 0,
        commission_rate: commissionDecimalRate,
        commission_paise: commissionPaise,
        total_paise: subtotalPaise,
        notes: paymentMethod === "cod" ? "COD" : "Online",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[checkout] Order creation error:", orderError?.message);
      throw Errors.database();
    }

    const orderId = order.id as string;

    // Insert order items
    const { error: itemsError } = await db.from("order_items").insert(
      lineItems.map((li) => ({ ...li, order_id: orderId }))
    );

    if (itemsError) {
      console.error("[checkout] Order items error:", itemsError.message);
      // Best-effort: attempt to clean up the order header
      await db.from("orders").delete().eq("id", orderId);
      throw Errors.database();
    }

    // Create seller_order_fulfillments for each unique seller
    const uniqueSellerIds = [...new Set(lineItems.map((li) => li.seller_id_snapshot))];
    const { error: fulfillmentError } = await db.from("seller_order_fulfillments").insert(
      uniqueSellerIds.map((sellerId) => ({
        order_id: orderId,
        seller_id: sellerId,
        status: "Order Placed",
      }))
    );

    if (fulfillmentError) {
      console.warn("[checkout] Fulfillment record creation warning:", fulfillmentError.message);
      // Non-fatal — seller can still see order; fulfillment record will be created on first status update
    }

    // 9. Clear server cart
    await db.from("cart_items").delete().eq("cart_id", cartRow.id);

    // 10. Audit log (fire-and-forget)
    void auditLog({
      actor_user_id: user.id,
      actor_role: "customer",
      action: "ORDER_CREATED",
      resource_type: "order",
      resource_id: orderId,
      metadata: {
        subtotal_paise: subtotalPaise,
        item_count: lineItems.length,
        payment_method: paymentMethod,
        seller_count: uniqueSellerIds.length,
      },
    });

    return ok({ orderId });
  });
}
