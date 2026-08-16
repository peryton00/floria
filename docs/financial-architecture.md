# Floria — Production Financial Architecture

This document specifies Floria's financial data structures, money representation rules, server-authoritative checkout calculations, commission modeling, and multi-nursery financial attribution.

---

## 1. Money Representation & Precision Rules

- **Integer Paise Representation**: All monetary values in Floria are stored and processed as non-negative **64-bit integer paise** (1 INR = 100 paise).
- **Floating-Point Ban**: Floating-point arithmetic is strictly banned for currency balances, subtotals, commissions, and line-item calculations to prevent round-off precision drift.
- **Example**: `₹1,299.50` is stored as `129950`.

---

## 2. Terminology & Standards

| Field | Meaning | Calculation / Attribution |
|---|---|---|
| `subtotal_paise` | Sum of item price * quantity | `sum(unit_price_paise * quantity)` |
| `discount_paise` | Applied coupon or promo discount | Subtracted from gross subtotal |
| `delivery_fee_paise` | Logistics delivery charge | Added to customer total (0 / Free) |
| `tax_paise` | Applicable GST / taxes | 0 (Not Configured) |
| `total_paise` / `customer_total` | Total amount charged to customer | `subtotal - discount + delivery + tax` |
| `commission_rate` | Platform commission percentage | Configured in `platform_settings` (e.g. 12 = 12%) |
| `commission_paise` | Platform commission amount | `Math.round(seller_gross_paise * (commission_rate / 100))` |
| `seller_gross_paise` | Total value of seller's items in order | `sum(seller_line_items * quantity)` |
| `seller_net_paise` | Net earnings credited to seller | `seller_gross_paise - commission_paise` |
| `payout_amount_paise` | Amount transferred to seller bank | Sum of `available` ledger entries |

---

## 3. Product Financial Calculation (Admin Inspection)

Authenticated Administrators can inspect the exact financial breakdown for any product:

```
Product: Snake Plant
Nursery: Green Leaf Nursery

────────────────────────────────────────
BASE PRODUCT PRICE
Nursery Base Price:       ₹500.00
Seller Discount:            ₹0.00
Seller Selling Price:     ₹500.00

────────────────────────────────────────
PLATFORM COMMISSION (Dynamic from platform_settings)
Commission Rate:              12%
Commission Amount:         ₹60.00

────────────────────────────────────────
SELLER EARNINGS
Seller Gross:             ₹500.00
Floria Commission:         ₹60.00
Seller Net Payout:        ₹440.00

────────────────────────────────────────
CUSTOMER CHARGES
Product Price:            ₹500.00
Delivery Fee:               ₹0.00 (Free)
Tax:                        Not Configured
CUSTOMER TOTAL:           ₹500.00
```

Formulas:
- `Selling Price` = `Base Price - Discount`
- `Commission` = `Selling Price × Commission Rate`
- `Seller Net` = `Selling Price - Commission`
- `Customer Total` = `Selling Price + Delivery + Tax`

---

## 4. Multi-Nursery Order Financial Breakdown

Multi-nursery master orders attribute gross earnings, platform commission, and net earnings per nursery partner:

```
Master Order #83F12A (Customer Total: ₹3,000)

Green Leaf Nursery:
  Items: 2x Monstera @ ₹500 = ₹1,000
  Gross: ₹1,000 | Platform Comm (12%): ₹120 | Seller Net: ₹880

Clay & Co.:
  Items: 1x Designer Ceramic Pot @ ₹2,000 = ₹2,000
  Gross: ₹2,000 | Platform Comm (12%): ₹240 | Seller Net: ₹1,760

Platform Summary:
  Product Subtotal: ₹3,000
  Total Platform Commission: ₹360
  Customer Total: ₹3,000
```

---

## 5. Security & Access Control

- **API Protection**: `GET /api/v1/admin/products/:id/financial-calculation` and `GET /api/v1/admin/orders/:id/financial-breakdown` require `role = admin` or `super_admin`.
- **Access Restrictions**:
  - Customer: `403 Forbidden`
  - Seller: `403 Forbidden`
  - Operations: `403 Forbidden`
  - Unauthenticated: `401 Unauthorized`
