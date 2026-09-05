// Floria API — H2 Webhook Constant-Time Signature Test Suite
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CashfreePaymentProvider } from "../src/payments/payment.provider.js";
import crypto from "crypto";

describe("H2: Webhook Constant-Time Signature Verification", () => {
  const provider = new CashfreePaymentProvider();
  const secret = "test-webhook-secret-key-12345";
  const originalSecret = process.env.CASHFREE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.CASHFREE_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    process.env.CASHFREE_WEBHOOK_SECRET = originalSecret;
  });

  it("verifies a valid exact HMAC signature successfully", async () => {
    const rawBody = JSON.stringify({
      data: {
        order: { order_id: "CF-ORD-12345", order_status: "PAID" },
        payment: { cf_payment_id: 998877, payment_status: "SUCCESS", payment_amount: 1499 },
      },
      event_time: "2026-09-05T12:00:00Z",
      type: "PAYMENT_SUCCESS_WEBHOOK",
    });
    const ts = "1725537600";
    const payloadToSign = `${ts}${rawBody}`;
    const validSig = crypto.createHmac("sha256", secret).update(payloadToSign).digest("base64");

    const result = await provider.verifyWebhookSignature({
      rawBody,
      signature: validSig,
      timestamp: ts,
      headers: {},
    });

    expect(result.isValid).toBe(true);
    expect(result.cfOrderId).toBe("CF-ORD-12345");
  });

  it("strictly rejects a signature when the valid signature is merely a substring (superset attack)", async () => {
    const rawBody = JSON.stringify({
      data: {
        order: { order_id: "CF-ORD-12345", order_status: "PAID" },
      },
    });
    const validSig = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
    const supersetSig = `PREFIX_${validSig}_SUFFIX`;

    const result = await provider.verifyWebhookSignature({
      rawBody,
      signature: supersetSig,
      headers: {},
    });

    expect(result.isValid).toBe(false);
  });

  it("strictly rejects signature when payload or timestamp was altered", async () => {
    const rawBody = JSON.stringify({ order_id: "ORD-ORIGINAL" });
    const ts = "1725537600";
    const validSig = crypto.createHmac("sha256", secret).update(`${ts}${rawBody}`).digest("base64");

    const tamperedResult = await provider.verifyWebhookSignature({
      rawBody: JSON.stringify({ order_id: "ORD-TAMPERED" }),
      signature: validSig,
      timestamp: ts,
      headers: {},
    });

    expect(tamperedResult.isValid).toBe(false);
  });
});
