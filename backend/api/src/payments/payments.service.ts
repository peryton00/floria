// Floria API — Cashfree Payments & Webhooks Service
import { getAdminDb } from "../config/database.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import {
  PaymentProviderFactory,
  VerifyWebhookInput,
} from "./payment.provider.js";
import { Errors } from "../utils/errors.js";

const processedWebhookEvents = new Set<string>();

export interface WebhookEventPayload {
  eventId: string;
  orderId?: string;
  providerPaymentId?: string;
  amountPaise?: number;
  status?: string;
}

export class PaymentsService {
  /**
   * Create or retrieve an active Cashfree payment session for an authenticated order.
   */
  async createPaymentSession(userId: string, orderId: string) {
    const db = getAdminDb();

    // 1. Verify master order ownership & fetch total
    const { data: order } = await db
      .from("orders")
      .select("id, customer_id, total_paise, notes, status")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      throw Errors.notFound("Order");
    }

    if (order.customer_id !== userId) {
      throw Errors.forbidden(
        "You do not have permission to initialize payment for this order.",
      );
    }

    // 2. Fetch customer details for Cashfree payload
    const { data: userProfile } = await db
      .from("user_profiles")
      .select("email, full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    const provider = PaymentProviderFactory.getProvider("cashfree");
    const paymentIntent = await provider.createPaymentIntent({
      masterOrderId: order.id,
      customerId: userId,
      amountPaise: order.total_paise,
      customerEmail: userProfile?.email || undefined,
      customerPhone: userProfile?.phone || undefined,
      customerName: userProfile?.full_name || undefined,
    });

    // 3. Upsert payment intent row in database
    const { data: paymentRow, error: payErr } = await db
      .from("payments")
      .upsert(
        {
          order_id: order.id,
          customer_id: userId,
          payment_reference: paymentIntent.paymentReference,
          cf_order_id:
            paymentIntent.cfOrderId || paymentIntent.paymentReference,
          payment_session_id: paymentIntent.paymentSessionId,
          provider: "cashfree",
          currency: "INR",
          amount_paise: order.total_paise,
          status: paymentIntent.status,
          raw_provider_response: paymentIntent.rawProviderResponse as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" },
      )
      .select()
      .maybeSingle();

    if (payErr) {
      console.warn("[PaymentsService] Payment upsert notice:", payErr.message);
    }

    return {
      paymentId: paymentRow?.id || paymentIntent.paymentReference,
      paymentSessionId: paymentIntent.paymentSessionId || "",
      cfOrderId: paymentIntent.cfOrderId || paymentIntent.paymentReference,
      orderId: order.id,
      amountPaise: order.total_paise,
      currency: "INR",
      environment: (
        process.env.CASHFREE_ENVIRONMENT || "SANDBOX"
      ).toUpperCase() as "SANDBOX" | "PRODUCTION",
    };
  }

  /**
   * Process incoming Cashfree webhooks with HMAC-SHA256 signature verification & DB idempotency.
   */
  async processWebhookInput(
    input: VerifyWebhookInput,
  ): Promise<{ success: boolean; idempotent: boolean; message: string }> {
    const provider = PaymentProviderFactory.getProvider("cashfree");
    const verification = await provider.verifyWebhookSignature(input);

    if (!verification.isValid && process.env.NODE_ENV === "production") {
      throw Errors.authRequired("Invalid Cashfree webhook signature");
    }

    const eventId =
      verification.providerEventId ||
      (input.headers["x-webhook-timestamp"]
        ? `cf_evt_${input.headers["x-webhook-timestamp"]}`
        : undefined);
    const cfOrderId =
      verification.cfOrderId ||
      (verification.payload?.data as any)?.order?.order_id;
    const cfPaymentId =
      verification.cfPaymentId ||
      (verification.payload?.data as any)?.payment?.cf_payment_id;
    const rawStatus = (
      verification.status ||
      (verification.payload?.data as any)?.payment?.payment_status ||
      ""
    ).toUpperCase();

    if (!cfOrderId) {
      return {
        success: false,
        idempotent: false,
        message: "Missing order reference in webhook payload",
      };
    }

    const eventKey = eventId || `cf_${cfOrderId}_${rawStatus}`;

    // Idempotency check
    if (processedWebhookEvents.has(eventKey)) {
      return {
        success: true,
        idempotent: true,
        message: "Webhook event already processed",
      };
    }

    const db = getAdminDb();
    if (eventId) {
      try {
        const { data: existingEvt } = await db
          .from("payment_events")
          .select("id")
          .eq("provider_event_id", eventId)
          .maybeSingle();

        if (existingEvt) {
          processedWebhookEvents.add(eventKey);
          return {
            success: true,
            idempotent: true,
            message: "Webhook event recorded in payment_events",
          };
        }
      } catch {}
    }

    processedWebhookEvents.add(eventKey);

    // Locate corresponding payment in database by cf_order_id, payment_reference, or order_id
    let payment: any = null;
    try {
      const q = db
        .from("payments")
        .select("id, order_id, customer_id, amount_paise, status");
      if (typeof q.or === "function") {
        const { data } = await q
          .or(
            `cf_order_id.eq.${cfOrderId},payment_reference.eq.${cfOrderId},order_id.eq.${cfOrderId}`,
          )
          .maybeSingle();
        payment = data;
      } else {
        const { data } = await q
          .eq("payment_reference", cfOrderId)
          .maybeSingle();
        payment = data;
      }
    } catch {
      try {
        const { data } = await db
          .from("payments")
          .select("id, order_id, customer_id, amount_paise, status")
          .eq("order_id", cfOrderId)
          .maybeSingle();
        payment = data;
      } catch {}
    }

    const isPaidSuccess =
      rawStatus === "SUCCESS" ||
      rawStatus === "PAID" ||
      rawStatus === "CAPTURED";
    const isFailed =
      rawStatus === "FAILED" ||
      rawStatus === "CANCELLED" ||
      rawStatus === "USER_DROPPED";

    if (payment) {
      const newStatus = isPaidSuccess
        ? "paid"
        : isFailed
          ? "failed"
          : "pending";

      await db
        .from("payments")
        .update({
          status: newStatus,
          cf_payment_id: cfPaymentId ? String(cfPaymentId) : undefined,
          webhook_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Record audit payment event
      if (eventId) {
        try {
          await db.from("payment_events").insert({
            payment_id: payment.id,
            event_type:
              verification.eventType || `PAYMENT_${newStatus.toUpperCase()}`,
            provider_event_id: eventId,
            status: newStatus,
            amount_paise: verification.amountPaise || payment.amount_paise,
            payload: verification.payload as any,
          });
        } catch {}
      }

      // Order & Notification state transitions
      if (isPaidSuccess && payment.order_id) {
        await db
          .from("orders")
          .update({ status: "seller_pending" })
          .eq("id", payment.order_id);

        // Update seller ledger entries to available
        await db
          .from("seller_ledger_entries")
          .update({ balance_state: "available" })
          .eq("order_id", payment.order_id);

        // Clear the customer's cart now that payment is confirmed
        if (payment.customer_id) {
          try {
            const { data: cartRow } = await db
              .from("carts")
              .select("id")
              .eq("user_id", payment.customer_id)
              .maybeSingle();
            if (cartRow) {
              await db.from("cart_items").delete().eq("cart_id", cartRow.id);
            }
          } catch (cartErr) {
            console.warn(
              "[PaymentsService] Cart clear on payment success warning:",
              cartErr,
            );
          }
        }

        // Trigger PAYMENT_SUCCESS notification
        if (payment.customer_id) {
          try {
            const { notificationService } =
              await import("../notifications/notification.service.js");
            await notificationService.createNotification({
              user_id: payment.customer_id,
              role: "customer",
              type: "PAYMENT_SUCCESS",
              title: "Payment Confirmed",
              message: `Payment of ₹${(payment.amount_paise / 100).toFixed(2)} was received successfully.`,
              data: { orderId: payment.order_id, paymentId: payment.id },
              source_type: "payment",
              source_id: `${payment.id}_paid`,
              navigation: {
                entityType: "ORDER",
                entityId: payment.order_id,
                action: "VIEW",
              },
            });
          } catch (notifErr) {
            console.error(
              "[PaymentsService] Payment success notification warning:",
              notifErr,
            );
          }
        }
      }
    }

    await auditRepository.log({
      actor_role: "system",
      action: "PAYMENT_WEBHOOK_PROCESSED",
      resource_type: "cashfree_webhook",
      resource_id: cfOrderId,
      metadata: { eventKey, status: rawStatus },
    });

    return {
      success: true,
      idempotent: false,
      message: "Cashfree webhook processed successfully",
    };
  }

  /**
   * Simplified legacy webhook endpoint support for backward compatibility.
   */
  async processWebhook(
    payload: WebhookEventPayload,
  ): Promise<{ success: boolean; idempotent: boolean; message: string }> {
    return this.processWebhookInput({
      signature: "",
      rawBody: JSON.stringify(payload),
      headers: {},
    });
  }

  /**
   * Reconcile payment status directly against backend DB.
   */
  async verifyAndReconcilePayment(userId: string, paymentId: string) {
    const db = getAdminDb();
    const { data: payment } = await db
      .from("payments")
      .select("*, orders(*)")
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) {
      throw Errors.notFound("Payment");
    }

    if (payment.customer_id && payment.customer_id !== userId) {
      throw Errors.forbidden("Unauthorized payment lookup");
    }

    return payment;
  }

  /**
   * Lookup orderId by Cashfree order ID (cf_order_id or payment_reference).
   */
  async lookupOrderByCfOrderId(
    cfOrderId: string,
  ): Promise<{ orderId: string }> {
    const db = getAdminDb();
    const { data: payment } = await db
      .from("payments")
      .select("order_id")
      .or(`cf_order_id.eq.${cfOrderId},payment_reference.eq.${cfOrderId}`)
      .maybeSingle();

    if (!payment?.order_id) {
      throw Errors.notFound("Order payment reference");
    }

    return { orderId: payment.order_id };
  }

  /**
   * Execute Cashfree refund for an order item/payment.
   */
  async processRefund(
    adminOrSellerUserId: string,
    paymentId: string,
    amountPaise: number,
    reason?: string,
  ) {
    const db = getAdminDb();
    const { data: payment } = await db
      .from("payments")
      .select(
        "id, order_id, cf_order_id, payment_reference, amount_paise, status",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) {
      throw Errors.notFound("Payment record");
    }

    if (amountPaise <= 0 || amountPaise > payment.amount_paise) {
      throw Errors.validation(
        "Refund amount must be between 1 and original total.",
      );
    }

    const provider = PaymentProviderFactory.getProvider("cashfree");
    const refundResult = await provider.processRefund({
      paymentReference: payment.payment_reference || payment.id,
      cfOrderId: payment.cf_order_id || undefined,
      amountPaise,
      reason,
    });

    // Save refund record
    const { data: refundRow } = await db
      .from("refunds")
      .insert({
        payment_id: payment.id,
        order_id: payment.order_id,
        refund_reference: refundResult.refundReference,
        amount_paise: amountPaise,
        reason: reason || "Floria admin refund",
        status: refundResult.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    // Update payment status to refunded or partially_refunded
    const newPayStatus =
      amountPaise >= payment.amount_paise ? "refunded" : "partially_refunded";
    await db
      .from("payments")
      .update({ status: newPayStatus })
      .eq("id", payment.id);

    await auditRepository.log({
      actor_user_id: adminOrSellerUserId,
      actor_role: "admin",
      action: "PAYMENT_REFUNDED",
      resource_type: "payment",
      resource_id: payment.id,
      metadata: { amountPaise, refundReference: refundResult.refundReference },
    });

    return refundRow;
  }

  /**
   * Admin Query: Fetch all payment transactions across platform with customer & order details.
   */
  async getAdminTransactions(filters: {
    search?: string;
    status?: string;
    limit?: number;
  }) {
    const db = getAdminDb();
    let query = db
      .from("payments")
      .select(
        "*, orders(id, total_paise, status, notes), user_profiles(email, full_name, phone)",
      )
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(
        "[PaymentsService] getAdminTransactions query notice:",
        error.message,
      );
      return [];
    }

    let results = (data || []).map((p: any) => {
      const u = p.user_profiles || {};
      const o = p.orders || {};
      return {
        id: p.id,
        orderId: p.order_id,
        customerId: p.customer_id,
        customerName: u.full_name || u.email?.split("@")[0] || "Customer",
        customerEmail: u.email || "",
        customerPhone: u.phone || "",
        paymentReference:
          p.payment_reference || p.cf_payment_id || p.cf_order_id || p.id,
        cfOrderId: p.cf_order_id || null,
        cfPaymentId: p.cf_payment_id || null,
        paymentSessionId: p.payment_session_id || null,
        provider: p.provider || "cashfree",
        currency: p.currency || "INR",
        amountPaise: p.amount_paise || o.total_paise || 0,
        status: p.status || "pending",
        createdAt: p.created_at || p.updated_at || new Date().toISOString(),
        updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
      };
    });

    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.id.toLowerCase().includes(s) ||
          r.orderId.toLowerCase().includes(s) ||
          r.customerName.toLowerCase().includes(s) ||
          r.customerEmail.toLowerCase().includes(s) ||
          r.paymentReference.toLowerCase().includes(s) ||
          (r.cfOrderId && r.cfOrderId.toLowerCase().includes(s)) ||
          (r.cfPaymentId && r.cfPaymentId.toLowerCase().includes(s)),
      );
    }

    return results;
  }
}

export const paymentsService = new PaymentsService();
