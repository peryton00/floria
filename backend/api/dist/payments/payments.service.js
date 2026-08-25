"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsService = exports.PaymentsService = void 0;
// Floria API — Cashfree Payments & Webhooks Service
const database_js_1 = require("../config/database.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const payment_provider_js_1 = require("./payment.provider.js");
const errors_js_1 = require("../utils/errors.js");
const processedWebhookEvents = new Set();
class PaymentsService {
    /**
     * Create or retrieve an active Cashfree payment session for an authenticated order.
     */
    async createPaymentSession(userId, orderId) {
        const db = (0, database_js_1.getAdminDb)();
        // 1. Verify master order ownership & fetch total
        const { data: order } = await db
            .from("orders")
            .select("id, customer_id, total_paise, notes, status")
            .eq("id", orderId)
            .maybeSingle();
        if (!order) {
            throw errors_js_1.Errors.notFound("Order");
        }
        if (order.customer_id !== userId) {
            throw errors_js_1.Errors.forbidden("You do not have permission to initialize payment for this order.");
        }
        // 2. Fetch customer details for Cashfree payload
        const { data: userProfile } = await db
            .from("user_profiles")
            .select("email, full_name, phone")
            .eq("id", userId)
            .maybeSingle();
        const provider = payment_provider_js_1.PaymentProviderFactory.getProvider("cashfree");
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
            .upsert({
            order_id: order.id,
            customer_id: userId,
            payment_reference: paymentIntent.paymentReference,
            cf_order_id: paymentIntent.cfOrderId || paymentIntent.paymentReference,
            payment_session_id: paymentIntent.paymentSessionId,
            provider: "cashfree",
            currency: "INR",
            amount_paise: order.total_paise,
            status: paymentIntent.status,
            raw_provider_response: paymentIntent.rawProviderResponse,
            updated_at: new Date().toISOString(),
        }, { onConflict: "order_id" })
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
            environment: (process.env.CASHFREE_ENVIRONMENT || "SANDBOX").toUpperCase(),
        };
    }
    /**
     * Process incoming Cashfree webhooks with HMAC-SHA256 signature verification & DB idempotency.
     */
    async processWebhookInput(input) {
        const provider = payment_provider_js_1.PaymentProviderFactory.getProvider("cashfree");
        const verification = await provider.verifyWebhookSignature(input);
        if (!verification.isValid && process.env.NODE_ENV === "production") {
            throw errors_js_1.Errors.authRequired("Invalid Cashfree webhook signature");
        }
        const eventId = verification.providerEventId || (input.headers["x-webhook-timestamp"] ? `cf_evt_${input.headers["x-webhook-timestamp"]}` : undefined);
        const cfOrderId = verification.cfOrderId || verification.payload?.data?.order?.order_id;
        const cfPaymentId = verification.cfPaymentId || verification.payload?.data?.payment?.cf_payment_id;
        const rawStatus = (verification.status || verification.payload?.data?.payment?.payment_status || "").toUpperCase();
        if (!cfOrderId) {
            return { success: false, idempotent: false, message: "Missing order reference in webhook payload" };
        }
        const eventKey = eventId || `cf_${cfOrderId}_${rawStatus}`;
        // Idempotency check
        if (processedWebhookEvents.has(eventKey)) {
            return { success: true, idempotent: true, message: "Webhook event already processed" };
        }
        const db = (0, database_js_1.getAdminDb)();
        if (eventId) {
            try {
                const { data: existingEvt } = await db
                    .from("payment_events")
                    .select("id")
                    .eq("provider_event_id", eventId)
                    .maybeSingle();
                if (existingEvt) {
                    processedWebhookEvents.add(eventKey);
                    return { success: true, idempotent: true, message: "Webhook event recorded in payment_events" };
                }
            }
            catch { }
        }
        processedWebhookEvents.add(eventKey);
        // Locate corresponding payment in database by cf_order_id, payment_reference, or order_id
        let payment = null;
        try {
            const q = db.from("payments").select("id, order_id, customer_id, amount_paise, status");
            if (typeof q.or === "function") {
                const { data } = await q.or(`cf_order_id.eq.${cfOrderId},payment_reference.eq.${cfOrderId},order_id.eq.${cfOrderId}`).maybeSingle();
                payment = data;
            }
            else {
                const { data } = await q.eq("payment_reference", cfOrderId).maybeSingle();
                payment = data;
            }
        }
        catch {
            try {
                const { data } = await db.from("payments").select("id, order_id, customer_id, amount_paise, status").eq("order_id", cfOrderId).maybeSingle();
                payment = data;
            }
            catch { }
        }
        const isPaidSuccess = rawStatus === "SUCCESS" || rawStatus === "PAID" || rawStatus === "CAPTURED";
        const isFailed = rawStatus === "FAILED" || rawStatus === "CANCELLED" || rawStatus === "USER_DROPPED";
        if (payment) {
            const newStatus = isPaidSuccess ? "paid" : isFailed ? "failed" : "pending";
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
                        event_type: verification.eventType || `PAYMENT_${newStatus.toUpperCase()}`,
                        provider_event_id: eventId,
                        status: newStatus,
                        amount_paise: verification.amountPaise || payment.amount_paise,
                        payload: verification.payload,
                    });
                }
                catch { }
            }
            // Order & Notification state transitions
            if (isPaidSuccess && payment.order_id) {
                await db.from("orders").update({ status: "seller_pending" }).eq("id", payment.order_id);
                // Update seller ledger entries to available
                await db
                    .from("seller_ledger_entries")
                    .update({ balance_state: "available" })
                    .eq("order_id", payment.order_id);
                // Trigger PAYMENT_SUCCESS notification
                if (payment.customer_id) {
                    try {
                        const { notificationService } = await import("../notifications/notification.service.js");
                        await notificationService.createNotification({
                            user_id: payment.customer_id,
                            role: "customer",
                            type: "PAYMENT_SUCCESS",
                            title: "Payment Confirmed",
                            message: `Payment of ₹${(payment.amount_paise / 100).toFixed(2)} was received successfully.`,
                            data: { orderId: payment.order_id, paymentId: payment.id },
                            source_type: "payment",
                            source_id: `${payment.id}_paid`,
                            navigation: { entityType: "ORDER", entityId: payment.order_id, action: "VIEW" },
                        });
                    }
                    catch (notifErr) {
                        console.error("[PaymentsService] Payment success notification warning:", notifErr);
                    }
                }
            }
        }
        await audit_repository_js_1.auditRepository.log({
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
    async processWebhook(payload) {
        return this.processWebhookInput({
            signature: "",
            rawBody: JSON.stringify(payload),
            headers: {},
        });
    }
    /**
     * Reconcile payment status directly against backend DB.
     */
    async verifyAndReconcilePayment(userId, paymentId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: payment } = await db
            .from("payments")
            .select("*, orders(*)")
            .eq("id", paymentId)
            .maybeSingle();
        if (!payment) {
            throw errors_js_1.Errors.notFound("Payment");
        }
        if (payment.customer_id && payment.customer_id !== userId) {
            throw errors_js_1.Errors.forbidden("Unauthorized payment lookup");
        }
        return payment;
    }
    /**
     * Execute Cashfree refund for an order item/payment.
     */
    async processRefund(adminOrSellerUserId, paymentId, amountPaise, reason) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: payment } = await db
            .from("payments")
            .select("id, order_id, cf_order_id, payment_reference, amount_paise, status")
            .eq("id", paymentId)
            .maybeSingle();
        if (!payment) {
            throw errors_js_1.Errors.notFound("Payment record");
        }
        if (amountPaise <= 0 || amountPaise > payment.amount_paise) {
            throw errors_js_1.Errors.validation("Refund amount must be between 1 and original total.");
        }
        const provider = payment_provider_js_1.PaymentProviderFactory.getProvider("cashfree");
        const refundResult = await provider.processRefund({
            paymentReference: payment.payment_reference || payment.id,
            cfOrderId: payment.cf_order_id || undefined,
            amountPaise,
            reason,
        });
        // Save refund record
        const { data: refundRow } = await db.from("refunds").insert({
            payment_id: payment.id,
            order_id: payment.order_id,
            refund_reference: refundResult.refundReference,
            amount_paise: amountPaise,
            reason: reason || "Floria admin refund",
            status: refundResult.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).select().maybeSingle();
        // Update payment status to refunded or partially_refunded
        const newPayStatus = amountPaise >= payment.amount_paise ? "refunded" : "partially_refunded";
        await db.from("payments").update({ status: newPayStatus }).eq("id", payment.id);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminOrSellerUserId,
            actor_role: "admin",
            action: "PAYMENT_REFUNDED",
            resource_type: "payment",
            resource_id: payment.id,
            metadata: { amountPaise, refundReference: refundResult.refundReference },
        });
        return refundRow;
    }
}
exports.PaymentsService = PaymentsService;
exports.paymentsService = new PaymentsService();
