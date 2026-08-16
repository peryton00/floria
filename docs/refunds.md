# Floria — Refunds & Cancellation Financial Policy

This document describes Floria's server-authoritative refund handling, cancellation policies, and audit trails.

---

## 1. Server-Authoritative Refund Execution

- **Server Control**: Refunds are initiated exclusively by authenticated server APIs or Admin Portal operations. The client browser never determines the refund amount.
- **Record Persistence**: Every refund creates a record in `public.refunds` linked to `payment_id` and `master_order_id`.
- **Ledger Impact**: Processing a refund creates a compensating `refund_debit` entry in `public.seller_ledger_entries`.

---

## 2. Cancellation & Refund Policy Matrix

| Order / Fulfillment Stage | Customer Cancellation | Refund Eligibility | Platform Commission Impact | Seller Impact |
|---|---|---|---|---|
| **Order Placed / Pending** | Allowed | 100% Refund | Commission Waived | No Impact |
| **Nursery Confirmed** | Allowed | 100% Refund | Commission Waived | Item stock restored |
| **Preparing / Packing** | Allowed | 100% Refund | Commission Waived | Item stock restored |
| **Ready for Pickup** | Allowed | 100% Refund | Commission Waived | Logistics notified |
| **Picked Up / Out for Delivery**| Support Approval Required | Case-by-case | Deduct logistics fee | Item returned |
| **Delivered (Within Return Window)** | Support Approval Required | Replacement / Refund | Refund debited | Returned to nursery |
