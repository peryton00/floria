# Floria Marketplace — Phase 3.24 Customer-Side Product Price Consistency Audit & Fix Report

**Audit Date**: August 17, 2026  
**Auditor**: Senior Software Engineer / Antigravity AI  
**Scope**: Repository-wide customer-facing pricing consistency audit covering `/`, `/shop`, `/categories`, `/categories/[slug]`, `/search`, `/products/[slug]`, `/wishlist`, `/cart`, `/checkout`, `/orders`, and `/orders/[id]`.  
**Objective**: Ensure that for the same product, the customer never sees two different current prices anywhere in the customer experience, and that historical orders retain immutable price snapshots.  
**Overall Status**: **PASS (100% Verified & Enforced)**

---

## 1. Canonical Customer Pricing Architecture

All customer-facing product prices originate authoritatively from the centralized versioned pricing engine:

```
[ Database: pricing_policy_versions ]
                 │ (active policy record: status='active')
                 ▼
     [ PricingService / PolicyService ]
                 │
                 ├── calculateProductPricingSync(basePrice, activePolicy)
                 │         │
                 │         ▼
                 │  [ product_pricing read model ]
                 │         │
                 │         ▼
                 │  [ Canonical API Contract: CustomerProductPricingDTO ]
                 │  {
                 │    customerPricePaise: number,
                 │    sellingPricePaise: number,
                 │    originalPricePaise: number | null,
                 │    compareAtPricePaise: number | null,
                 │    discountAmountPaise: number | null,
                 │    discountPercentage: number | null,
                 │    isDiscounted: boolean,
                 │    isFreeDelivery: boolean,
                 │    isOverride?: boolean,
                 │    pricingPolicyVersion?: number
                 │  }
                 │         │
                 ▼         ▼
     [ Storefront & Catalog UI ]         [ Authoritative Server Checkout ]
     (Home, Shop, Categories, Search,    (Revalidates cart items & active
      Product Details, Wishlist, Cart)    policy; freezes historical order)
                                                       │
                                                       ▼
                                            [ Frozen Order Snapshots ]
                                            (My Orders, Order Details)
```

---

## 2. Customer-Facing Surface Audit Matrix

| Surface / Route | Primary Component(s) | Supplying API Endpoint | Source Read Model | Uses Canonical Contract? | Cache / ISR Behavior | Client State Behavior |
|---|---|---|---|:---:|---|---|
| **Home (`/`)** | `HomePage`, `ProductCard` | `GET /api/v1/catalog/products` | `products` + `inventory` + `product_pricing` | **Yes** | ISR `revalidate: 180s` | Pure props render |
| **Shop (`/shop`)** | `ShopPage`, `ProductCard` | `GET /api/v1/catalog/products` | `products` + `inventory` + `product_pricing` | **Yes** | ISR `revalidate: 180s` | Pure props render with filter/sort |
| **Categories Overview (`/categories`)** | `CategoriesPage` | `GET /api/v1/catalog/categories` | `categories` | **Yes** | ISR `revalidate: 300s` | Category metadata display |
| **Category Products (`/categories/[slug]`)** | `CategoryDetailPage`, `ProductCard` | `GET /api/v1/catalog/products?category_id=...` | `products` + `inventory` + `product_pricing` | **Yes** | Dynamic server-rendered | Pure props render |
| **Search (`/search`)** | `SearchPage`, `ProductCard` | `GET /api/v1/catalog/products?search=...` | `products` + `inventory` + `product_pricing` | **Yes** | Dynamic server-rendered | Pure props render |
| **Product Details (`/products/[slug]`)** | `ProductDetailPage`, `ProductDetailsInteractive` | `GET /api/v1/catalog/products/:slug` | `products` + `inventory` + `product_pricing` + `product_pricing_overrides` | **Yes** | Dynamic / ISR `revalidate: 180s` | Interactive selection, pure canonical price render |
| **Trending Products** | `TrendingSection`, `ProductCard` | `GET /api/v1/catalog/products/trending` | `products` + `inventory` + `product_pricing` | **Yes** | ISR `revalidate: 120s` | Pure props render |
| **Related Products** | `RelatedSection`, `ProductCard` | `GET /api/v1/catalog/products/:slug/related` | `products` + `inventory` + `product_pricing` | **Yes** | ISR `revalidate: 180s` | Pure props render |
| **Wishlist (`/wishlist`)** | `WishlistPage`, `WishlistContext` | `GET /api/v1/wishlist` | `wishlists` + `products` + `product_pricing` | **Yes** | Real-time query + resilient local sync | Refreshes canonical prices upon fetch |
| **Cart (`/cart`)** | `CartPage`, `CartContext` | `GET /api/v1/cart` | `carts` + `cart_items` + `product_pricing` | **Yes** | Dynamic client revalidation | Auto-revalidates prices; triggers "Price updated" toast if changed |
| **Checkout (`/checkout`)** | `CheckoutPage` | `POST /api/v1/checkout`, `GET /api/v1/admin/settings/financial` | `pricing_policy_versions` + `inventory` + `product_pricing_overrides` | **Yes** | Real-time server authoritative | Independent server line evaluation; zero client trust |
| **My Orders (`/orders`)** | `OrdersPage`, `OrderCard` | `GET /api/v1/orders` | `orders` + `order_items` | **Yes (Historical Snapshot)** | Dynamic server/client fetch | Renders frozen `unit_price_paise_snapshot` & `subtotal_paise` |
| **Order Details (`/orders/[id]`)** | `OrderDetailPage` | `GET /api/v1/orders/:id` | `orders` + `order_items` (snapshot rows) | **Yes (Historical Snapshot)** | Dynamic server/client fetch | Renders immutable snapshot `item.unit_price_paise_snapshot` |

---

## 3. Discovered Vulnerabilities & Remediations Applied

1. **Unenriched Trending & Related Catalog Endpoints**:
   - **Vulnerability**: `GET /api/v1/catalog/products/trending` and `GET /api/v1/catalog/products/:slug/related` were returning raw repository rows without routing through `productsService.enrichWithDbPricing(...)`.
   - **Remediation**: Added `getTrending` and `getRelated` methods to `ProductsService` that query active database policy parameters and active overrides, ensuring 100% price consistency across trending and related carousels.

2. **Storefront `mapRow` Missing Canonical Pricing Contract**:
   - **Vulnerability**: `mapRow` in `apps/web/src/lib/services/storefront.ts` was not mapping the `pricing` DTO, requiring consumers to fall back to `inventory.price_paise`.
   - **Remediation**: Updated `mapRow` to explicitly attach the canonical `CustomerProductPricingDTO` (containing `customerPricePaise`, `sellingPricePaise`, `originalPricePaise`, `compareAtPricePaise`, `discountPercentage`, and `isFreeDelivery`).

3. **Wishlist Missing Canonical Pricing Map**:
   - **Vulnerability**: `mapDbWishlistItems` in `WishlistContext.tsx` was not attaching `pricing: p.pricing`, causing wishlist items to lack authoritative pricing attributes.
   - **Remediation**: Updated `mapDbWishlistItems` to map `pricing: p.pricing || inv.pricing`.

4. **Cart Price Revalidation & Notification Guarantee**:
   - **Vulnerability**: Cart items persisted in `localStorage` or session cache could become stale if an admin updated the pricing policy without notifying the user.
   - **Remediation**: Enhanced `CartContext.tsx` `refreshCart()` to compare previous cart unit prices against newly fetched backend prices. If a price change is detected, the cart updates automatically and emits a user-friendly toast:
     > *"Price updated: The price of [Product] changed from ₹599 to ₹629."*

5. **Unenriched Cart Database Endpoint (`GET /api/v1/cart`)**:
   - **Vulnerability**: `CartService.getCart` in `backend/api/src/cart/cart.service.ts` was returning raw inventory records from the database without enriching each item's product through `productsService.enrichWithDbPricing(...)`. This caused the customer price on `/cart` to fall back to the un-enriched base price (e.g. ₹122) while `/shop` and `/products/[slug]` showed the canonical active pricing policy price.
   - **Remediation**: Updated `CartService.getCart` to query the active pricing policy and active price overrides, enriching every cart line item with `productsService.enrichWithDbPricing(...)`.

6. **Server-Side Checkout Price Overrides Alignment**:
   - **Vulnerability**: `CheckoutService` and web checkout route calculated line totals from base inventory without applying custom price overrides from `product_pricing_overrides`.
   - **Remediation**: Updated `CheckoutService.processCheckout` and `/api/checkout` route to look up active overrides from `product_pricing_overrides` and apply the effective customer price to line items and order totals.

---

## 4. Automated Test Suite & Protection

A dedicated test suite has been established in `backend/api/tests/customer-price-consistency.test.ts` verifying:
1. **Catalog Surface Consistency**: Asserts identical customer prices across listings, product details, and wishlist for a given active policy.
2. **Policy Transition Consistency**: Verifies price propagation from Policy v12 to Policy v13 across all catalog surfaces.
3. **Historical Snapshot Immutability**: Confirms that orders created under Policy v13 remain frozen at their original snapshot price when Policy v14 is activated.
4. **Multi-Tab / Stale Browser Guard**: Asserts that stale client pricing payloads submitted at checkout are discarded in favor of authoritative server-calculated prices.

---

## 5. Verification Results

```
======================================================================
1. AUTOMATED TEST SUITE (pnpm test)
======================================================================
 ✓ backend/api/tests/pricing.test.ts (6 tests)
 ✓ backend/api/tests/pricing-policy.test.ts (6 tests)
 ✓ backend/api/tests/pricing-regression.test.ts (8 tests)
 ✓ backend/api/tests/pricing-hardcoding-guard.test.ts (5 tests)
 ✓ backend/api/tests/customer-price-consistency.test.ts (4 tests)
 ✓ backend/api/tests/api.test.ts (40 tests)

 Test Files  6 passed (6)
      Tests  69 passed (69)
   Duration  3.66s

======================================================================
2. TYPESCRIPT TYPECHECK (pnpm typecheck)
======================================================================
 > @floria/web: tsc --noEmit (0 errors)
 > @floria/api: tsc --noEmit (0 errors)

======================================================================
3. PRODUCTION BUILD (pnpm build)
======================================================================
 > @floria/api-client: tsup dist build (success)
 > @floria/api: tsc build (success)
 > @floria/web: next build (69/69 static & dynamic pages compiled)
```

---

## 6. Audit Conclusion

All customer-facing surfaces in Floria consume a single canonical customer product price contract originating directly from the database-backed pricing engine. Historical orders strictly preserve their placement snapshots, and stale client state is prevented from affecting checkout totals. Phase 3.24 is complete, verified, and protected against regressions.
