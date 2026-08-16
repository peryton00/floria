# Floria — Customer Value & Pricing Presentation System

This document specifies Floria's customer-facing pricing presentation rules, value communication, delivery benefit badges, trust signals, maintenance fee disclosures, and the strict isolation between internal financial components and customer-visible prices.

---

## 1. Architectural Principle: Server-Authoritative Pricing

- **Single Source of Truth**: The existing server-side pricing engine (`PricingService` & `platform_settings`) is the ONLY source of truth for all customer-facing prices.
- **No Frontend Calculations**: The customer frontend NEVER calculates, estimates, invents, or manipulates selling prices, discounts, savings, delivery fees, maintenance fees, commissions, profit margins, or hidden delivery recovery.
- **DTO Isolation**: Internal accounting fields are strictly stripped from customer API responses.

---

## 2. Customer-Visible vs. Internal (Admin-Only) Boundary

| Pricing Parameter | Visibility Scope | Presentation / Handling |
|---|---|---|
| **Final Customer Selling Price** | **Customer-Facing** | Visually dominant, serif/bold typography (`ProductPriceBlock`) |
| **Legitimate Comparison / Discount Price** | **Customer-Facing** | Strikethrough text with `{N}% OFF` badge (ONLY when provided by server) |
| **Free Delivery Qualification** | **Customer-Facing** | `FREE DELIVERY` badge & optional `You save ₹40 on delivery` subtext |
| **Platform Maintenance Fee** | **Customer-Facing** | Transparently disclosed at checkout (`₹10.00`) with ⓘ explanation tooltip |
| **Customer Reviews & Ratings** | **Customer-Facing** | Real database values (`avg_rating`, `review_count`) or `"No reviews yet"` |
| **Nursery Trust Badges** | **Customer-Facing** | `"Sold by {Nursery}"` & `"✓ Verified Nursery"` (real database flag) |
| **Seller Base Price** | **ADMIN ONLY** | Never exposed to customer clients |
| **Seller Commission Cut (15%)** | **ADMIN ONLY** | Never exposed to customer clients |
| **Floria Profit Margin (2%)** | **ADMIN ONLY** | Never exposed to customer clients |
| **Hidden Free Delivery Recovery (₹20)** | **ADMIN ONLY** | Never exposed to customer clients |
| **Seller Net Revenue Payout** | **ADMIN ONLY** | Never exposed to customer clients |

---

## 3. Product Price Hierarchy & Rules

1. **Hierarchy Order**:
   - Product Name
   - Rating Summary (`StarRating` or `"No reviews yet"`)
   - Final Customer Selling Price (Large serif typography)
   - Legitimate Discount & Savings (if active from server)
   - Free Delivery Benefit
   - Nursery & Value Summary Signals

2. **No Fake Discounts Rule**:
   - If no legitimate comparison price exists, the UI displays ONLY the final customer selling price.
   - Banned states: `0% OFF`, `No discount`, `Regular price`, fake artificial MRP.

3. **Badge Capping Rule**:
   - Maximum **2 simultaneous badges** per `ProductCard` to prevent visual overload and keep the interface calm and trustworthy.

---

## 4. Fee Disclosure & Maintenance Fee Tooltip

- **Platform Maintenance Fee**: Charged once per checkout (`₹10.00`). Listed transparently in Cart & Checkout order summaries.
- **Information Tooltip ⓘ**: Clicking/hovering on the maintenance fee displays:
  > *"Helps us operate the Floria marketplace and services."*

---

## 5. Historical Order Snapshot Immutability

Historical orders snapshot all customer fees, discounts, maintenance fees, and seller settlement details at the exact moment of order placement. Changing platform settings in the Admin panel affects ONLY future listings and transactions; completed orders remain 100% immutable.
