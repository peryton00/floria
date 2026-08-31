// Floria API — Payment Provider Abstraction Layer & Cashfree Production Provider
import { randomUUID, createHmac } from "crypto";

export interface CreatePaymentIntentInput {
  masterOrderId: string;
  customerId: string;
  amountPaise: number;
  currency?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  idempotencyKey?: string;
  returnUrl?: string;
}

export interface VerifyWebhookInput {
  signature: string;
  rawBody: string;
  timestamp?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface PaymentProviderResult {
  paymentReference: string;
  provider: string;
  status:
    "pending" | "authorized" | "captured" | "paid" | "failed" | "cancelled";
  amountPaise: number;
  currency: string;
  cfOrderId?: string;
  paymentSessionId?: string;
  rawProviderResponse?: Record<string, unknown>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  providerEventId?: string;
  eventType?: string;
  cfOrderId?: string;
  cfPaymentId?: string;
  amountPaise?: number;
  status?: string;
  payload?: Record<string, unknown>;
}

export interface RefundResult {
  refundReference: string;
  status: "processed" | "pending" | "failed";
  amountPaise: number;
  cfRefundId?: string;
  rawProviderResponse?: Record<string, unknown>;
}

export interface PaymentProvider {
  providerName: string;

  createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentProviderResult>;

  verifyWebhookSignature(
    input: VerifyWebhookInput,
  ): Promise<WebhookVerificationResult>;

  processRefund(input: {
    paymentReference: string;
    cfOrderId?: string;
    amountPaise: number;
    reason?: string;
    idempotencyKey?: string;
  }): Promise<RefundResult>;

  fetchOrderStatus?(cfOrderId: string): Promise<{
    isPaid: boolean;
    status: string;
    cfPaymentId?: string;
    rawResponse?: Record<string, unknown>;
  }>;
}

// 1. Cash On Delivery (COD) Provider Implementation
export class CodPaymentProvider implements PaymentProvider {
  public providerName = "cod";

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentProviderResult> {
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

  async verifyWebhookSignature(
    _input: VerifyWebhookInput,
  ): Promise<WebhookVerificationResult> {
    return { isValid: false };
  }

  async processRefund(input: {
    paymentReference: string;
    amountPaise: number;
    reason?: string;
  }): Promise<RefundResult> {
    return {
      refundReference: `REF-COD-${randomUUID().slice(0, 8)}`,
      status: "processed",
      amountPaise: input.amountPaise,
      rawProviderResponse: { mode: "manual_cod_refund", reason: input.reason },
    };
  }

  async fetchOrderStatus(_cfOrderId: string) {
    return { isPaid: true, status: "PAID" };
  }
}

// 2. Cashfree Production Payment Provider Implementation
export class CashfreePaymentProvider implements PaymentProvider {
  public providerName = "cashfree";

  private getBaseUrl(): string {
    const env = (process.env.CASHFREE_ENVIRONMENT || "SANDBOX").toUpperCase();
    return env === "PRODUCTION"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-version": process.env.CASHFREE_API_VERSION || "2023-08-01",
      "x-client-id": process.env.CASHFREE_CLIENT_ID || "",
      "x-client-secret": process.env.CASHFREE_CLIENT_SECRET || "",
    };
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentProviderResult> {
    const clientId = process.env.CASHFREE_CLIENT_ID?.trim();
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET?.trim();
    const orderAmountRupees = Number((input.amountPaise / 100).toFixed(2));
    const cfOrderId = `CF-ORD-${input.masterOrderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}-${Date.now()}`;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Cashfree Client ID and Client Secret are not configured in server environment variables.",
      );
    }

    if (orderAmountRupees < 1) {
      throw new Error(
        `Order amount ₹${orderAmountRupees} is below the minimum ₹1 required by Cashfree.`,
      );
    }

    // Sanitize customer details according to Cashfree API requirements
    // customer_id: alphanumeric + underscore + hyphen, max 50 chars. Strip dashes from UUID then prepend 'cust_'.
    const rawCustId = (input.customerId || "user")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 44);
    const sanitizedCustId = `cust_${rawCustId}`;

    let rawPhone = (input.customerPhone || "").replace(/\D/g, "");
    if (rawPhone.length > 10) rawPhone = rawPhone.slice(-10);
    const sanitizedPhone = rawPhone.length === 10 ? rawPhone : "9999999999";

    const sanitizedEmail =
      input.customerEmail &&
      /^[^@]+@[^@]+\.[^@]+$/.test(input.customerEmail.trim())
        ? input.customerEmail.trim()
        : `cust${rawCustId.slice(0, 8)}@floria.in`;

    const sanitizedName = (
      input.customerName?.trim() || "Floria Customer"
    ).slice(0, 50);

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://floriaa-web.vercel.app";
    const returnUrl =
      input.returnUrl ||
      `${appUrl}/checkout?order_id={order_id}&floria_order_id=${input.masterOrderId}`;

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

    console.log(
      "[CashfreePaymentProvider] Sending to Cashfree:",
      JSON.stringify({
        url,
        apiVersion: this.getHeaders()["x-api-version"],
        order_id: cfOrderId,
        order_amount: orderAmountRupees,
        customer_id: sanitizedCustId,
        customer_email: sanitizedEmail,
        customer_phone: sanitizedPhone,
        return_url: returnUrl,
      }),
    );

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const resJson = (await response.json()) as any;

    if (!response.ok || !resJson?.payment_session_id) {
      console.error(
        "[CashfreePaymentProvider] Cashfree API error:",
        JSON.stringify({
          status: response.status,
          resJson,
          sentPayload: {
            order_id: cfOrderId,
            order_amount: orderAmountRupees,
            customer_id: sanitizedCustId,
          },
        }),
      );
      const errMsg =
        resJson?.message ||
        resJson?.code ||
        `Cashfree API HTTP ${response.status}`;
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

  async fetchOrderStatus(cfOrderId: string): Promise<{
    isPaid: boolean;
    status: string;
    cfPaymentId?: string;
    rawResponse?: Record<string, unknown>;
  }> {
    if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
      return { isPaid: false, status: "UNCONFIGURED" };
    }

    try {
      const url = `${this.getBaseUrl()}/orders/${encodeURIComponent(cfOrderId)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { isPaid: false, status: `HTTP_${response.status}` };
      }

      const resJson = (await response.json()) as any;
      const orderStatus = (resJson?.order_status || "").toUpperCase();

      if (orderStatus === "PAID") {
        return {
          isPaid: true,
          status: "PAID",
          rawResponse: resJson,
        };
      }

      // Check payments endpoint as secondary verification
      try {
        const paymentsUrl = `${this.getBaseUrl()}/orders/${encodeURIComponent(cfOrderId)}/payments`;
        const payRes = await fetch(paymentsUrl, {
          method: "GET",
          headers: this.getHeaders(),
        });
        if (payRes.ok) {
          const paymentsJson = (await payRes.json()) as any[];
          if (Array.isArray(paymentsJson)) {
            const successPayment = paymentsJson.find(
              (p) => (p.payment_status || "").toUpperCase() === "SUCCESS",
            );
            if (successPayment) {
              return {
                isPaid: true,
                status: "PAID",
                cfPaymentId: successPayment.cf_payment_id
                  ? String(successPayment.cf_payment_id)
                  : undefined,
                rawResponse: successPayment,
              };
            }
            const lastPayment = paymentsJson[paymentsJson.length - 1];
            if (lastPayment) {
              return {
                isPaid: false,
                status: (
                  lastPayment.payment_status || orderStatus
                ).toUpperCase(),
                rawResponse: lastPayment,
              };
            }
          }
        }
      } catch {}

      return {
        isPaid: false,
        status: orderStatus || "PENDING",
        rawResponse: resJson,
      };
    } catch (e: any) {
      console.warn(
        "[CashfreePaymentProvider] fetchOrderStatus error:",
        e.message,
      );
      return { isPaid: false, status: "ERROR" };
    }
  }

  async verifyWebhookSignature(
    input: VerifyWebhookInput,
  ): Promise<WebhookVerificationResult> {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;
    let body: any = undefined;
    try {
      body = JSON.parse(input.rawBody || "{}");
    } catch {}

    const order = body?.data?.order;
    const payment = body?.data?.payment;
    const cfOrderId = order?.order_id || body?.orderId || body?.eventId;
    const cfPaymentId = payment?.cf_payment_id
      ? String(payment.cf_payment_id)
      : body?.providerPaymentId
        ? String(body.providerPaymentId)
        : undefined;
    const rawStatus =
      payment?.payment_status || order?.order_status || body?.status;
    const amtPaise = payment?.payment_amount
      ? Math.round(Number(payment.payment_amount) * 100)
      : body?.amountPaise
        ? Number(body.amountPaise)
        : undefined;

    if (!secret || !input.signature) {
      return {
        isValid: false,
        providerEventId: body?.event_time
          ? `cf_evt_${body.event_time}_${cfOrderId}`
          : body?.eventId
            ? String(body.eventId)
            : undefined,
        eventType: body?.type || body?.event,
        cfOrderId,
        cfPaymentId,
        amountPaise: amtPaise,
        status: rawStatus,
        payload: body,
      };
    }

    try {
      const ts =
        input.timestamp ||
        (input.headers["x-webhook-timestamp"] as string) ||
        "";
      const payloadToSign = ts ? `${ts}${input.rawBody}` : input.rawBody;

      const computedSig = createHmac("sha256", secret)
        .update(payloadToSign)
        .digest("base64");

      const isValid =
        computedSig === input.signature ||
        input.signature.includes(computedSig);

      return {
        isValid,
        providerEventId: body?.event_time
          ? `cf_evt_${body.event_time}_${cfOrderId}`
          : body?.eventId
            ? String(body.eventId)
            : undefined,
        eventType: body?.type || body?.event,
        cfOrderId,
        cfPaymentId,
        amountPaise: amtPaise,
        status: rawStatus,
        payload: body,
      };
    } catch (err: any) {
      console.error(
        "[CashfreePaymentProvider] Webhook verification error:",
        err?.message,
      );
      return { isValid: false };
    }
  }

  async processRefund(input: {
    paymentReference: string;
    cfOrderId?: string;
    amountPaise: number;
    reason?: string;
    idempotencyKey?: string;
  }): Promise<RefundResult> {
    const refundRef = `REF-CF-${randomUUID().slice(0, 8)}`;
    const orderIdToRefund = input.cfOrderId || input.paymentReference;
    const refundAmountRupees = Number((input.amountPaise / 100).toFixed(2));

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        refundReference: refundRef,
        status: "processed",
        amountPaise: input.amountPaise,
        rawProviderResponse: {
          mode: "cashfree_mock_refund",
          reason: input.reason,
        },
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

      const resJson = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(resJson?.message || "Cashfree refund call failed");
      }

      return {
        refundReference: refundRef,
        status: resJson?.refund_status === "SUCCESS" ? "processed" : "pending",
        amountPaise: input.amountPaise,
        cfRefundId: resJson?.cf_refund_id
          ? String(resJson.cf_refund_id)
          : undefined,
        rawProviderResponse: resJson,
      };
    } catch (err: any) {
      console.warn(
        "[CashfreePaymentProvider] Refund API call exception:",
        err?.message,
      );
      return {
        refundReference: refundRef,
        status: "pending",
        amountPaise: input.amountPaise,
        rawProviderResponse: {
          error: err?.message,
          mode: "cashfree_refund_queued",
        },
      };
    }
  }
}

export class PaymentProviderFactory {
  public static getProvider(providerName: string): PaymentProvider {
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
