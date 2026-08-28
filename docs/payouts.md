# Floria — Seller Payout Architecture

This document describes the payout lifecycle, eligibility calculation, idempotency constraints, and settlement workflows.

---

## 1. Payout Lifecycle

```
Seller Requests / Automated Trigger
 ↓
Check Eligibility (Available Balance >= Minimum Threshold, Active Seller Status, No Hold)
 ↓
Create Payout Batch (`public.payouts` with status = 'pending')
 ↓
Link Ledger Items (`public.payout_items`)
 ↓
Execute Bank Transfer (Cashfree Easy Split / Bank API)
 ↓
Update Payout Status ('paid' or 'failed') & Append 'payout_debit' Ledger Entry
```

---

## 2. Payout Eligibility Rules

A seller is eligible for a payout if:

1. Seller status is `approved`.
2. Available ledger balance (`available_earnings_paise`) is `>= ₹500` (50000 paise).
3. No active administrative or fraud holds exist on the seller profile.
4. Orders associated with the ledger entries have reached `delivered` status and passed the return policy window.

---

## 3. Payout Idempotency

- `payout_reference` is uniquely indexed in `public.payouts`.
- `unq_payout_ledger_item` constraint prevents the same ledger entry from being assigned to multiple payout batches.
