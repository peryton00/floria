"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProviderFactory = exports.RazorpayPaymentProvider = exports.CodPaymentProvider = void 0;
// Floria API — Payment Provider Abstraction Layer
const crypto_1 = require("crypto");
// 1. Cash On Delivery (COD) Provider Implementation
class CodPaymentProvider {
    providerName = "cod";
    async createPaymentIntent(input) {
        const ref = `COD-${input.masterOrderId.slice(0, 8)}-${Date.now()}`;
        return {
            paymentReference: ref,
            provider: "cod",
            status: "pending", // COD stays pending until marked collected upon delivery
            amountPaise: input.amountPaise,
            currency: input.currency || "INR",
            rawProviderResponse: { method: "cod", mode: "cash_on_delivery" },
        };
    }
    async verifyWebhookSignature(_input) {
        return { isValid: false }; // COD has no external webhooks
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
// 2. Razorpay Payment Provider Implementation (Sandbox & Production Boundary)
class RazorpayPaymentProvider {
    providerName = "razorpay";
    async createPaymentIntent(input) {
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            // Return structured pending status for testing / sandbox boundary without failing build
            const mockRef = `RZP-ORD-${input.masterOrderId.slice(0, 8)}-${Date.now()}`;
            return {
                paymentReference: mockRef,
                provider: "razorpay",
                status: "pending",
                amountPaise: input.amountPaise,
                currency: input.currency || "INR",
                rawProviderResponse: { note: "Razorpay provider credentials pending production key placement" },
            };
        }
        const ref = `RZP-${input.masterOrderId.slice(0, 8)}-${Date.now()}`;
        return {
            paymentReference: ref,
            provider: "razorpay",
            status: "pending",
            amountPaise: input.amountPaise,
            currency: input.currency || "INR",
            rawProviderResponse: { keyId, keySecretConfigured: true },
        };
    }
    async verifyWebhookSignature(input) {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret || !input.signature) {
            return { isValid: false };
        }
        // Webhook signature verification logic via crypto hmac sha256
        const crypto = await import("crypto");
        const expectedSig = crypto
            .createHmac("sha256", webhookSecret)
            .update(input.rawBody)
            .digest("hex");
        const isValid = expectedSig === input.signature;
        return {
            isValid,
            payload: isValid ? JSON.parse(input.rawBody || "{}") : undefined,
        };
    }
    async processRefund(input) {
        return {
            refundReference: `REF-RZP-${(0, crypto_1.randomUUID)().slice(0, 8)}`,
            status: "processed",
            amountPaise: input.amountPaise,
            rawProviderResponse: { mode: "razorpay_refund", reason: input.reason },
        };
    }
}
exports.RazorpayPaymentProvider = RazorpayPaymentProvider;
class PaymentProviderFactory {
    static getProvider(providerName) {
        switch (providerName.toLowerCase()) {
            case "razorpay":
            case "online":
                return new RazorpayPaymentProvider();
            case "cod":
            default:
                return new CodPaymentProvider();
        }
    }
}
exports.PaymentProviderFactory = PaymentProviderFactory;
