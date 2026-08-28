# Floria — Immutable Seller Earnings Ledger

This document details the append-only ledger architecture used for seller earnings, balance states, and financial transaction history.

---

## 1. Append-Only Ledger Principle

- **Immutability**: `public.seller_ledger_entries` is strictly append-only. Historical transactions are **never** edited or updated.
- **Compensating Entries**: Adjustments or refunds create new compensating debit or credit entries rather than modifying past rows.
- **Audit Trace**: Every entry stores `seller_id`, `master_order_id`, `payment_id`, `entry_type`, `amount_paise`, `balance_state`, `description`, and timestamp.

---

## 2. Entry Types & Balance States

### Entry Types

- `earning_credit`: Net earnings credited to seller from a placed order.
- `commission_debit`: Platform commission deducted.
- `refund_debit`: Deductions from customer refunds.
- `payout_debit`: Funds transferred to seller's bank account.
- `adjustment_credit` / `adjustment_debit`: Admin manual adjustments.

### Balance States

- `pending`: Earnings from active orders that are not yet delivered.
- `available`: Earnings from delivered orders past return policy window, eligible for payout.
- `paid`: Earnings already paid out via seller bank settlements.
- `refunded`: Earnings deducted due to customer order refunds.
