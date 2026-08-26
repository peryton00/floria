"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProviderFactory = exports.CashfreePaymentProvider = exports.CodPaymentProvider = void 0;
// Floria API — Payment Provider Abstraction Layer & Cashfree Production Provider
const crypto_1 = require("crypto");
// 1. Cash On Delivery (COD) Provider Implementation
class CodPaymentProvider {
    providerName = "cod";
    async createPaymentIntent(input) {
        const ref = `COD-${input.masterOrderId.slice(0, 8)}-${Date.now()}`;
        return {
            paymentReference: ref,
            provider: "cod",
            status: "pending",
            amountPaise: input.amountPaise,
            currency: input.currency || "INR",
            rawProviderResponse: { method: "cod", mode: "cash_on_delivery" },
        };
    }
    async verifyWebhookSignature(_input) {
        return { isValid: false };
    }
    async processRefund(input) {
        return {
            refundReference: `REF-COD-${(0, crypto_1.randomUUID)().slice(0, 8)}`,
            status: "processed",
            amountPaise: input.amountPaise,
            rawProviderResponse: { mode: "manual_cod_refund", reason: input.reason },
        };
    }
}
exports.CodPaymentProvider = CodPaymentProvider;
// 2. Cashfree Production Payment Provider Implementation
class CashfreePaymentProvider {
    providerName = "cashfree";
    getBaseUrl() {
        const env = (process.env.CASHFREE_ENVIRONMENT || "SANDBOX").toUpperCase();
        return env === "PRODUCTION"
            ? "https://api.cashfree.com/pg"
            : "https://sandbox.cashfree.com/pg";
    }
    getHeaders() {
        return {
            "Content-Type": "application/json",
            "x-api-version": process.env.CASHFREE_API_VERSION || "2023-08-01",
            "x-client-id": process.env.CASHFREE_CLIENT_ID || "",
            "x-client-secret": process.env.CASHFREE_CLIENT_SECRET || "",
        };
    }
    async createPaymentIntent(input) {
        const clientId = process.env.CASHFREE_CLIENT_ID?.trim();
        const clientSecret = process.env.CASHFREE_CLIENT_SECRET?.trim();
        const orderAmountRupees = Number((input.amountPaise / 100).toFixed(2));
        const cfOrderId = `CF-ORD-${input.masterOrderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}-${Date.now()}`;
        if (!clientId || !clientSecret) {
            throw new Error("Cashfree Client ID and Client Secret are not configured in server environment variables.");
        }
        if (orderAmountRupees < 1) {
            throw new Error(`Order amount ₹${orderAmountRupees} is below the minimum ₹1 required by Cashfree.`);
        }
        // Sanitize customer details according to Cashfree API requirements
        // customer_id: alphanumeric + underscore + hyphen, max 50 chars. Strip dashes from UUID then prepend 'cust_'.
        const rawCustId = (input.customerId || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 44);
        const sanitizedCustId = `cust_${rawCustId}`;
        let rawPhone = (input.customerPhone || "").replace(/\D/g, "");
        if (rawPhone.length > 10)
            rawPhone = rawPhone.slice(-10);
        const sanitizedPhone = rawPhone.length === 10 ? rawPhone : "9999999999";
        const sanitizedEmail = input.customerEmail && /^[^@]+@[^@]+\.[^@]+$/.test(input.customerEmail.trim())
            ? input.customerEmail.trim()
            : `cust${rawCustId.slice(0, 8)}@floria.in`;
        const sanitizedName = (input.customerName?.trim() || "Floria Customer").slice(0, 50);
        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://floriaa-web.vercel.app";
        const returnUrl = input.returnUrl || `${appUrl}/checkout?order_id={order_id}&floria_order_id=${input.masterOrderId}`;
        const url = `${this.getBaseUrl()}/orders`;
        const body = {
            order_id: cfOrderId,
            order_amount: orderAmountRupees,
            order_currency: input.currency || "INR",
            customer_details: {
                customer_id: sanitizedCustId,
                customer_email: sanitizedEmail,
                customer_phone: sanitizedPhone,
                customer_name: sanitizedName,
            },
            order_meta: {
                return_url: returnUrl,
                notify_url: `${process.env.API_BASE_URL || "https://floria-api.onrender.com"}/api/v1/payments/webhooks/cashfree`,
            },
        };
        console.log("[CashfreePaymentProvider] Sending to Cashfree:", JSON.stringify({
            url,
            apiVersion: this.getHeaders()["x-api-version"],
            order_id: cfOrderId,
            order_amount: orderAmountRupees,
            customer_id: sanitizedCustId,
            customer_email: sanitizedEmail,
            customer_phone: sanitizedPhone,
            return_url: returnUrl,
        }));
        const response = await fetch(url, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        const resJson = (await response.json());
        if (!response.ok || !resJson?.payment_session_id) {
            console.error("[CashfreePaymentProvider] Cashfree API error:", JSON.stringify({
                status: response.status,
                resJson,
                sentPayload: { order_id: cfOrderId, order_amount: orderAmountRupees, customer_id: sanitizedCustId },
            }));
            const errMsg = resJson?.message || resJson?.code || `Cashfree API HTTP ${response.status}`;
            throw new Error(`Cashfree Payment Error: ${errMsg}`);
        }
        return {
            paymentReference: cfOrderId,
            provider: "cashfree",
            status: "pending",
            amountPaise: input.amountPaise,
            currency: input.currency || "INR",
            cfOrderId: resJson.cf_order_id || cfOrderId,
            paymentSessionId: resJson.payment_session_id,
            rawProviderResponse: resJson,
        };
    }
    async verifyWebhookSignature(input) {
        const secret = process.env.CASHFREE_WEBHOOK_SECRET;
        let body = undefined;
        try {
            body = JSON.parse(input.rawBody || "{}");
        }
        catch { }
        const order = body?.data?.order;
        const payment = body?.data?.payment;
        const cfOrderId = order?.order_id || body?.orderId || body?.eventId;
        const cfPaymentId = payment?.cf_payment_id ? String(payment.cf_payment_id) : (body?.providerPaymentId ? String(body.providerPaymentId) : undefined);
        const rawStatus = payment?.payment_status || order?.order_status || body?.status;
        const amtPaise = payment?.payment_amount ? Math.round(Number(payment.payment_amount) * 100) : (body?.amountPaise ? Number(body.amountPaise) : undefined);
        if (!secret || !input.signature) {
            return {
                isValid: false,
                providerEventId: body?.event_time ? `cf_evt_${body.event_time}_${cfOrderId}` : (body?.eventId ? String(body.eventId) : undefined),
                eventType: body?.type || body?.event,
                cfOrderId,
                cfPaymentId,
                amountPaise: amtPaise,
                status: rawStatus,
                payload: body,
            };
        }
        try {
            const ts = input.timestamp || input.headers["x-webhook-timestamp"] || "";
            const payloadToSign = ts ? `${ts}${input.rawBody}` : input.rawBody;
            const computedSig = (0, crypto_1.createHmac)("sha256", secret)
                .update(payloadToSign)
                .digest("base64");
            const isValid = computedSig === input.signature || input.signature.includes(computedSig);
            return {
                isValid,
                providerEventId: body?.event_time ? `cf_evt_${body.event_time}_${cfOrderId}` : (body?.eventId ? String(body.eventId) : undefined),
                eventType: body?.type || body?.event,
                cfOrderId,
                cfPaymentId,
                amountPaise: amtPaise,
                status: rawStatus,
                payload: body,
            };
        }
        catch (err) {
            console.error("[CashfreePaymentProvider] Webhook verification error:", err?.message);
            return { isValid: false };
        }
    }
    async processRefund(input) {
        const refundRef = `REF-CF-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        const orderIdToRefund = input.cfOrderId || input.paymentReference;
        const refundAmountRupees = Number((input.amountPaise / 100).toFixed(2));
        const clientId = process.env.CASHFREE_CLIENT_ID;
        const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return {
                refundReference: refundRef,
                status: "processed",
                amountPaise: input.amountPaise,
                rawProviderResponse: { mode: "cashfree_mock_refund", reason: input.reason },
            };
        }
        try {
            const url = `${this.getBaseUrl()}/orders/${orderIdToRefund}/refunds`;
            const response = await fetch(url, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    refund_id: refundRef,
                    refund_amount: refundAmountRupees,
                    refund_note: input.reason || "Floria customer refund",
                }),
            });
            const resJson = (await response.json());
            if (!response.ok) {
                throw new Error(resJson?.message || "Cashfree refund call failed");
            }
            return {
                refundReference: refundRef,
                status: resJson?.refund_status === "SUCCESS" ? "processed" : "pending",
                amountPaise: input.amountPaise,
                cfRefundId: resJson?.cf_refund_id ? String(resJson.cf_refund_id) : undefined,
                rawProviderResponse: resJson,
            };
        }
        catch (err) {
            console.warn("[CashfreePaymentProvider] Refund API call exception:", err?.message);
            return {
                refundReference: refundRef,
                status: "pending",
                amountPaise: input.amountPaise,
                rawProviderResponse: { error: err?.message, mode: "cashfree_refund_queued" },
            };
        }
    }
}
exports.CashfreePaymentProvider = CashfreePaymentProvider;
class PaymentProviderFactory {
    static getProvider(providerName) {
        switch (providerName.toLowerCase()) {
            case "cashfree":
            case "online":
            case "upi":
            case "card":
                return new CashfreePaymentProvider();
            case "cod":
            default:
                return new CodPaymentProvider();
        }
    }
}
exports.PaymentProviderFactory = PaymentProviderFactory;
