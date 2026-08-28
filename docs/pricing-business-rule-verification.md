# Floria — Pricing Engine Business-Rule Verification (Phase 3.17.4)

This document verifies the exact execution sequence and mathematical accuracy of Floria's server-authoritative unified pricing, commission, profit, maintenance fee, and free-delivery recovery engine against the approved business rules.

---

## 1. Verified Pricing Sequence

The exact pricing pipeline executed by [`PricingService.calculateProductPricing`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/backend/api/src/pricing/pricing.service.ts) is:

```
1. Seller Base Price = Entered by seller in integer paise (e.g. 50000 = ₹500.00)
2. Floria Profit = Seller Base Price × 2%
3. Pre-Recovery Product Price = Seller Base Price + Floria Profit

4. Threshold Eligibility Check:
   IF Pre-Recovery Product Price >= ₹599.00 (59900 paise):
       freeDeliveryEligible = true
       deliveryRecovery = ₹20.00 (2000 paise)
   ELSE:
       freeDeliveryEligible = false
       deliveryRecovery = ₹0.00

5. Customer Product Price = Pre-Recovery Product Price + Applicable Delivery Recovery
```

_Crucial Rule Verification_: The delivery recovery amount (₹20.00) is incorporated **after** evaluating the pre-recovery price against the ₹599.00 threshold. The recovery itself **never** pushes an ineligible product over the threshold.

---

## 2. Test Verification Matrix (6 Mandatory Test Cases)

| Test Case  | Seller Base Price        | Floria Profit (2%) | Pre-Recovery Price | Threshold >= ₹599? | Free Delivery Eligible? | Delivery Recovery | Customer Product Price |
| ---------- | ------------------------ | ------------------ | ------------------ | ------------------ | ----------------------- | ----------------- | ---------------------- |
| **Case 1** | ₹500.00                  | ₹10.00             | ₹510.00            | NO                 | **NO**                  | ₹0.00             | **₹510.00**            |
| **Case 2** | ₹580.00                  | ₹11.60             | ₹591.60            | NO                 | **NO**                  | ₹0.00             | **₹591.60**            |
| **Case 3** | ₹588.00                  | ₹11.76             | ₹599.76            | YES                | **YES**                 | ₹20.00            | **₹619.76**            |
| **Case 4** | ₹600.00                  | ₹12.00             | ₹612.00            | YES                | **YES**                 | ₹20.00            | **₹632.00**            |
| **Case 5** | ₹599.00                  | ₹11.98             | ₹610.98            | YES                | **YES**                 | ₹20.00            | **₹630.98**            |
| **Case 6** | 2x ₹500.00 (Cart ₹1,000) | ₹10.00 each        | ₹510.00 each       | NO each            | **NO**                  | ₹0.00 each        | **₹510.00 each**       |

_Case 6 Key Finding_: Cart total of ₹1,000 does **NOT** make either ₹500 product free-delivery eligible. Free delivery eligibility is evaluated strictly **per product**.

---

## 3. Platform Maintenance Fee Verification

- **Rule**: ₹10.00 (1000 paise) is charged **ONCE** per checkout master order.
- **Verification**:
  - 1 Product checkout -> Maintenance Fee: ₹10.00
  - 5 Products checkout -> Maintenance Fee: ₹10.00
  - Multi-nursery split checkout -> Maintenance Fee: ₹10.00
  - Does NOT multiply per product or per nursery partner.

---

## 4. Seller Commission & Net Settlement Verification

- **Formula**: `seller_commission = seller_base_price * 12%` (deducted from seller base price).
- **Seller Net Payout**: `seller_net = seller_base_price - seller_commission`.
- **Example**: Base = ₹500.00, Commission (12%) = ₹60.00 -> Seller Net = ₹440.00.
- Floria profit (2%), delivery recovery (₹20.00), and platform maintenance fee (₹10.00) belong to platform economics and do **not** increase seller payout.

---

## 5. Security & Visibility Matrix

| Financial Attribute      | Customer View             | Seller View                     | Admin View  |
| ------------------------ | ------------------------- | ------------------------------- | ----------- |
| Seller Base Price        | Hidden                    | **Visible**                     | **Visible** |
| Seller Commission        | Hidden                    | **Visible** (as settlement cut) | **Visible** |
| Floria Profit (2%)       | **Hidden**                | **Hidden**                      | **Visible** |
| Delivery Recovery (₹20)  | **Hidden**                | **Hidden**                      | **Visible** |
| Customer Product Price   | **Visible**               | **Visible** (as listing price)  | **Visible** |
| Platform Maintenance Fee | **Visible** (at Checkout) | Hidden                          | **Visible** |
| Delivery Fee & Reason    | **Visible** (at Checkout) | Hidden                          | **Visible** |

---

## 6. Immutable Historical Snapshots

Order and Order Items tables store immutable snapshot columns:

- `base_price_paise_snapshot`
- `floria_profit_rate_snapshot` & `floria_profit_paise_snapshot`
- `delivery_recovery_paise_snapshot`
- `customer_price_paise_snapshot`
- `is_free_delivery_eligible_snapshot`
- `commission_rate_snapshot` & `commission_paise_snapshot`
- `maintenance_fee_paise`

Updating Admin settings in `platform_settings` later will **never** alter past historical orders.

---

## Final Verdict

### **APPROVED FOR PRICING ENGINE BUSINESS-RULE VERIFICATION**
