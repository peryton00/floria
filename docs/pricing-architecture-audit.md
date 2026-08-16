# Floria — Pricing Architecture Audit Report (Phase 3.23)

## 1. Executive Summary

This audit examined Floria's existing financial, commission, profit, delivery fee, and recalculation pipelines across the monorepo. The goal was to eliminate conflicting database configuration keys, ban fabricated hardcoded rate fallbacks, enforce strict order immutability, and migrate to a centralized versioned pricing policy architecture.

---

## 2. Key Findings & Resolved Conflicts

### 2.1 Duplicate Settings Keys Resolved
- **Problem**: Two conflicting keys existed in `platform_settings`:
  - `platform_commission_rate` (legacy 12.0% key from early migration `0011_platform_settings.sql`)
  - `seller_commission_rate` (canonical key from migration `0020_pricing_commission_profit_engine.sql`)
- **Resolution**: Consolidated exclusively on `seller_commission_rate` backed by the `pricing_policy_versions` table and `PricingService`. Legacy endpoints now route through `PricingService`.

### 2.2 Hardcoded Fallback Elimination
- **Problem**: `seller.repository.ts` contained `order.commission_rate || 0.12` and `admin-financial.service.ts` contained `fin?.commission_rate ?? order.commission_rate ?? 0.12`. If an order snapshot lacked a value, it silently fabricated a 12% commission cut.
- **Resolution**: All fallback calculations now strictly read the immutable snapshots stored at order creation (`order_items.commission_rate_snapshot`, `seller_order_financials.commission_rate`, `orders.commission_rate`). If not present, default to 0 to prevent fabricating uncontracted deductions.

### 2.3 Historical Order Price Immutability
- **Problem**: Frontend helper functions in `OrderContext.tsx` and `orders/[id]/page.tsx` contained delivery fee fallbacks like `(o.subtotal_paise >= 49900 ? 0 : 4000)`. If a historical order placed under a ₹499 policy was viewed after the threshold changed to ₹599, it would incorrectly recalculate delivery fee.
- **Resolution**: Order views now strictly render the persisted snapshot columns (`delivery_fee_paise`, `maintenance_fee_paise`, `subtotal_paise`, `total_paise`).

### 2.4 Checkout Price Transparency
- **Problem**: Checkout summary previously used a hardcoded 1.25 multiplier for fake discount display and stale ₹499 threshold.
- **Resolution**: Cart & checkout now compute real MRP discounts based on server-returned original prices, show accurate estimated totals, and checkout performs a fresh server-authoritative pricing evaluation.

---

## 3. Architecture Status

| Component | Status | Verification |
|---|---|---|
| Versioned Policy Schema (`0021`) | ✅ Completed | Tested via `policy.service.ts` & `policy.test.ts` |
| Read Model (`product_pricing`) | ✅ Completed | Upserted via batch worker |
| Recalculation Engine | ✅ Completed | Asynchronous 500-item batch processor |
| Immutable Snapshots | ✅ Enforced | Zero dynamic recalculations on `/orders` |
| Admin Governance & Audit Log | ✅ Enforced | All mutations logged to `audit_logs` |
