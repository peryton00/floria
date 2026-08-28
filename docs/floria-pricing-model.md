# Floria — Unified Pricing, Profit, Commission & Free-Delivery Engine

This document defines Floria's server-authoritative product pricing pipeline, seller commission deduction, internal profit margin, checkout maintenance fee, free delivery eligibility, and hidden delivery recovery policy.

---

## 1. The Four Admin-Controlled Financial Components

Floria's financial model is built on four distinct parameters managed by Administrators:

| Parameter                    | Default  | Calculation / Application Scope                                                        | Visibility                                 |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Seller Commission**        | `12%`    | Deducted from the seller's entered base price: `seller_commission = base_price * 12%`. | Admin, Seller                              |
| **Floria Profit Margin**     | `2%`     | Added during product listing: `profit = base_price * 2%`.                              | Admin ONLY (Hidden from Customer & Seller) |
| **Platform Maintenance Fee** | `₹10.00` | Charged once at checkout per master order.                                             | Customer (at Checkout), Admin              |
| **Free-Delivery Recovery**   | `₹20.00` | Added into product price if product is eligible for free delivery.                     | Admin ONLY (Hidden from Customer & Seller) |

---

## 2. Product Pricing & Eligibility Pipeline

Seller enters: **`seller_base_price`** (e.g. ₹500.00 = 50000 paise).

```
1. Seller Base Price:               ₹500.00  (50000 paise)
2. Floria Profit (2% Internal):      +₹10.00  ( 1000 paise)
────────────────────────────────────────────────────────────
3. Pre-Recovery Product Price:      ₹510.00  (51000 paise)

4. Free Delivery Eligibility Check:
   Threshold: ₹599.00 (59900 paise)
   Is ₹510.00 >= ₹599.00? -> NO (Not Eligible)

5. Delivery Recovery:                 +₹0.00
────────────────────────────────────────────────────────────
6. FINAL CUSTOMER PRODUCT PRICE:    ₹510.00  (51000 paise)
```

### Worked Example B (Free Delivery Eligible Item):

Seller enters: **`seller_base_price`** = **₹600.00** (60000 paise).

```
1. Seller Base Price:               ₹600.00  (60000 paise)
2. Floria Profit (2% Internal):      +₹12.00  ( 1200 paise)
────────────────────────────────────────────────────────────
3. Pre-Recovery Product Price:      ₹612.00  (61200 paise)

4. Free Delivery Eligibility Check:
   Threshold: ₹599.00 (59900 paise)
   Is ₹612.00 >= ₹599.00? -> YES (FREE DELIVERY ELIGIBLE!)

5. Delivery Recovery (₹20.00):       +₹20.00  ( 2000 paise)
────────────────────────────────────────────────────────────
6. FINAL CUSTOMER PRODUCT PRICE:    ₹632.00  (63200 paise)
```

---

## 3. Product-Level Free Delivery Eligibility Rules

- **Product-Level Evaluation**: Free delivery is evaluated **per product / order item**, NOT on cart subtotal or master order total!
- **Threshold Rule**: Product is eligible if `product_price >= ₹599.00` (`59900` paise).
- **Cart Delivery Fee**:
  - If **ALL** products in the cart are free-delivery eligible -> Cart Delivery Fee = **`₹0.00`** (`FREE_DELIVERY_THRESHOLD`).
  - If **ANY** product in the cart is not free-delivery eligible -> Cart Delivery Fee = **`₹40.00`** (`PAID_BELOW_THRESHOLD`).

---

## 4. Platform Maintenance Fee

- **Scope**: Applied **once** per checkout / master order.
- **Default Amount**: `₹10.00` (`1000` paise).
- **Checkout Display**: Listed clearly at checkout as `Platform Maintenance Fee`.
- **Exclusion**: Does **not** count toward the ₹599.00 free delivery threshold and does **not** increase seller payout.

---

## 5. Seller Earnings & Net Settlement

Seller revenue is strictly computed on their entered base price:

- `seller_commission = seller_base_price * seller_commission_rate` (e.g. ₹500 * 12% = ₹60)
- `seller_net_payout = seller_base_price - seller_commission` (e.g. ₹500 - ₹60 = ₹440)

Floria profit margin, delivery recovery, and maintenance fees belong to platform economics and do **not** increase seller payout.

---

## 6. Immutable Historical Order Snapshots

All pricing parameters and item financial breakdowns are snapshotted on `orders` and `order_items`:

- `base_price_paise_snapshot`
- `floria_profit_rate_snapshot`
- `floria_profit_paise_snapshot`
- `delivery_recovery_paise_snapshot`
- `customer_price_paise_snapshot`
- `is_free_delivery_eligible_snapshot`
- `commission_rate_snapshot`
- `commission_paise_snapshot`
- `maintenance_fee_paise`

Historical orders are immutable and will never change if Admin modifies pricing or commission settings later.
