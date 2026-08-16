# Floria — Payment Integration & State Machine

This document details Floria's payment provider abstraction, state machines, payment idempotency, and webhook verification architecture.

---

## 1. Payment Provider Abstraction Layer

Floria uses an abstract interface (`PaymentProvider`) to decouple checkout logic from external gateway SDKs:

```typescript
export interface PaymentProvider {
  providerName: string;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentProviderResult>;
  verifyWebhookSignature(input: VerifyWebhookInput): Promise<WebhookVerificationResult>;
  processRefund(input: RefundInput): Promise<RefundResult>;
}
```

Active Implementations:
- `CodPaymentProvider`: Manages Cash on Delivery transactions.
- `RazorpayPaymentProvider`: Manages online card, UPI, netbanking, and wallet payments via Razorpay API.

---

## 2. Payment State Machine vs Order Fulfillment State Machine

Payment state and order fulfillment state are maintained as **decoupled state machines**:

```
Payment State Machine:
[Pending] ──► [Authorized] ──► [Captured] ──► [Refunded / Partially Refunded]
   │                              │
   └──► [Cancelled / Failed] ─────┘

Order Fulfillment State Machine:
[Order Placed] ──► [Nursery Confirmed] ──► [Preparing] ──► [Ready for Pickup] ──► [Picked Up] ──► [Delivered]
```

---

## 3. Payment Idempotency & Webhook Verification

1. **Idempotency**:
   - `idempotency_key` is generated server-side or passed from client checkout.
   - Enforced by a `UNIQUE` index on `public.payments(idempotency_key)`.
   - Prevents duplicate order placement or duplicate payment creation on network retries.

2. **Webhook Security**:
   - Webhooks verify HMAC-SHA256 signatures using server-stored secrets (`RAZORPAY_WEBHOOK_SECRET`).
   - Webhook events are logged in `public.payment_events` with `provider_event_id` uniqueness constraints for deduplication.
   - Webhook amounts are strictly verified against expected order amounts before marking payment captured.
