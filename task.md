# Phase 3.17 — Payments, Financial Ledger, Commission & Seller Payout Foundation

## Existing Financial Model & Audit

- **Order Table (`orders`)**: Stores `subtotal_paise`, `delivery_fee_paise`, `commission_rate`, `commission_paise`, `total_paise`.
- **Order Items (`order_items`)**: Stores `unit_price_paise_snapshot` and `quantity`.
- **Settings (`platform_settings`)**: Configures platform commission rate (`commission_rate`).

## Identified Financial Gaps & Remediations

1. **Multi-Nursery Sub-Order Attribution**: Added `seller_order_financials` snapshot table to track per-seller gross, commission, and net attribution on split orders.
2. **Immutable Append-Only Seller Earnings Ledger**: Created `seller_ledger_entries` table (`earning_credit`, `commission_debit`, `refund_debit`, `payout_debit`) and `LedgerService`.
3. **Payment Provider Abstraction Layer**: Created `PaymentProvider` interface with `CodPaymentProvider` and `RazorpayPaymentProvider` implementations.
4. **Payment Schema**: Created `payments`, `payment_events`, `refunds`, `payouts`, and `payout_items` tables with uniqueness & DB constraints.
5. **Real Database Payout Queries**: Updated `sellerRepository.getPayouts()` and `sellersService.getPayouts()` to query `payouts` and `seller_ledger_entries` from PostgreSQL.

## Migration

- `supabase/migrations/0018_financial_ledger_and_payments.sql`

## Documentation Suite

- `docs/financial-architecture.md`
- `docs/payment-integration.md`
- `docs/seller-ledger.md`
- `docs/payouts.md`
- `docs/refunds.md`
