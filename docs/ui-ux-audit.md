# Floria Platform UI/UX Audit & Screen Classification

> **Canonical Document:** Comprehensive UI/UX inventory, classification, and design-system evaluation of the existing Floria platform across Customer Web, Seller Web, Admin Web, Operations, and Mobile target implications.

---

## 1. Executive Summary & Strategy

Floria already possesses an established, functional marketplace platform. The design direction is defined in [`DESIGN.md`](../DESIGN.md).

The UI/UX development strategy is:

```
EXISTING PLATFORM → AUDIT → UNDERSTAND → CLASSIFY → PRESERVE WHAT WORKS → POLISH → REDESIGN ONLY WITH EVIDENCE
```

### Screen Classification Legend:

- **KEEP:** The screen is functioning well. IA, UX, design system tokens, and responsiveness are sound.
- **POLISH:** Solid architecture and UX; needs minor token alignment, spacing/responsive tuning, or accessibility fixes.
- **REDESIGN:** Meaningful UX/IA friction, confusing task flow, high cognitive load, or poor mobile experience.
- **REBUILD:** Fundamental technical architecture/state management defect preventing incremental polish.
- **NEW:** Genuinely missing required platform capability (e.g. Delivery Mobile native flows).

---

## 2. Complete Application & Screen Inventory

### A. Customer Web Surfaces (`apps/web`)

| Screen / Route                                                                                                              | Purpose                                                          | Major Components                                                             | Classification | Evidence & Action                                                                            |
| :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------- |
| `/` (Homepage)                                                                                                              | Hero, nursery highlights, bestsellers, value props               | `CustomerShell`, `ProductCard`, `FadeUp`, `BotanicalAmbient`                 | **KEEP**       | Rich editorial layout, warm sand palette, responsive grid, animated ambient life.            |
| `/shop`                                                                                                                     | Full catalog, category filters, price slider, sort               | `FilterSidebar`, `FilterAndSortControls`, `ProductCard`, `EmptyState`        | **KEEP**       | Complete desktop sticky sidebar, mobile drawer controls, empty states, server pricing.       |
| `/products/[slug]`                                                                                                          | Product details, gallery, reviews, price breakdown, stock status | `ProductDetailsInteractive`, `ReviewForm`, `ReviewList`, `ProductPriceBlock` | **KEEP**       | Clean media gallery, instant delivery benefit badge, verified review form, wishlist trigger. |
| `/categories`                                                                                                               | Category tree overview                                           | Category grid, banner cards, count badges                                    | **KEEP**       | Intuitive category card grid with botanical icons.                                           |
| `/categories/[slug]`                                                                                                        | Category-specific product listing                                | Category header, filter controls, product grid                               | **KEEP**       | Reuses `/shop` filtered query engine with category banner context.                           |
| `/nurseries`                                                                                                                | Verified nursery partner directory & rankings                    | Nursery summary cards, ratings, location badges                              | **POLISH**     | Needs subtle card hover elevation polish and consistent nursery banner aspect ratios.        |
| `/search`                                                                                                                   | Global search query results                                      | Search header, query chips, product grid                                     | **KEEP**       | Real-time query binding and empty state guidance.                                            |
| `/cart`                                                                                                                     | Multi-nursery cart, quantity controls, delivery threshold bar    | Multi-seller groupings, subtotal block, delivery savings badge               | **KEEP**       | Clean multi-nursery grouping, automatic subtotal calculation, move-to-wishlist action.       |
| `/checkout`                                                                                                                 | Delivery address selection, order notes, Cashfree SDK modal, COD | Address selector/modal, payment gateway launcher, pricing breakdown          | **POLISH**     | Address creation modal form validation feedback needs clearer inline error indicators.       |
| `/orders`                                                                                                                   | Customer order history list                                      | Order status cards, item thumbnails, order date                              | **KEEP**       | Clear timeline status badge, track button, repeat order link.                                |
| `/orders/[id]`                                                                                                              | Order tracking timeline & delivery details                       | Step tracker (Placed → Picked Up → Delivered), address snapshot              | **POLISH**     | Mobile step tracker needs tighter vertical layout on small screens (<375px).                 |
| `/wishlist`                                                                                                                 | Saved botanical items                                            | Wishlist product grid, move to cart button                                   | **KEEP**       | Clean empty state, instant cart addition.                                                    |
| `/account`                                                                                                                  | Profile editing & saved address book                             | `ProfileEditModal`, `AddressModal`, user avatar                              | **POLISH**     | Profile edit modal could use cleaner focus ring styling consistent with `DESIGN.md`.         |
| `/login` & `/signup`                                                                                                        | Email/password & Google OAuth                                    | Auth form, OAuth buttons, terms notice                                       | **POLISH**     | Spacing around OAuth divider needs minor alignment with warm cream theme.                    |
| Informational Pages (`/about`, `/contact`, `/faq`, `/help`, `/how-it-works`, `/terms`, `/privacy`, `/shipping`, `/returns`) | Customer support & policy documentation                          | Editorial text shells, FAQ accordions, policy sections                       | **KEEP**       | High typography legibility, standard semantic structure.                                     |

---

### B. Seller Web Surfaces (`apps/web/src/app/seller/*` & `@floria/seller-web`)

| Screen / Route                                   | Purpose                                                                         | Major Components                                                       | Classification | Evidence & Action                                                                                  |
| :----------------------------------------------- | :------------------------------------------------------------------------------ | :--------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------- |
| `/seller/login` & `/seller/register`             | Seller sign in & nursery onboarding application                                 | Application form, document upload trigger                              | **POLISH**     | Form inputs use hardcoded gray borders; align with `border-floria-border` and Sand input surfaces. |
| `/seller/dashboard`                              | Nursery metrics, today's orders, quick stock adjustment, alert feed             | `SellerShell`, KPI cards, `SellerDashboardSkeleton`, Quick stock modal | **KEEP**       | Live metrics, quick stock modal, pending approval guard, urgent alerts.                            |
| `/seller/products`                               | Nursery catalog management, active/draft filters                                | Product table, status badge, action menu                               | **POLISH**     | Table headers on mobile view need horizontal scroll hint or responsive card collapse.              |
| `/seller/products/new` & `/seller/products/[id]` | Create/edit plant, base pricing, multi-image upload                             | `ProductImageUploader`, category selector, inventory inputs            | **POLISH**     | Multi-image drag-and-drop preview could use clearer primary image badge indication.                |
| `/seller/inventory`                              | Rapid stock updater, low stock thresholds, SKU tracking                         | Inline stock editor, search filter                                     | **KEEP**       | Instant stock adjustments, low-stock threshold warning flags.                                      |
| `/seller/orders`                                 | Nursery fulfillment order queue                                                 | Order status filter, customer summary, action triggers                 | **KEEP**       | Clean order filtering by nursery fulfillment status.                                               |
| `/seller/orders/[id]`                            | Order detail & status step progression (Placed → Confirmed → Preparing → Ready) | Sequential status progression buttons, item list                       | **KEEP**       | Strict forward status transitions preventing out-of-order execution.                               |
| `/seller/earnings` & `/seller/payouts`           | Seller ledger, completed order credits, payout history                          | Payout ledger table, available balance card                            | **KEEP**       | Transparent breakdown of net payout, commission deduction, and status.                             |
| `/seller/documents`                              | KYC business verification upload (FSSAI/GST/Nursery License)                    | Document upload widget, verification status pill                       | **KEEP**       | PDF/JPEG upload with file size validation and admin review status.                                 |
| `/seller/profile` & `/seller/settings`           | Nursery name, address, operating hours, notification toggles                    | Form fields, notification checklist                                    | **POLISH**     | Needs consistent Sand input surfaces matching `DESIGN.md`.                                         |
| `/seller/reviews`                                | Feedback from customers on nursery plants                                       | Review cards, response drawer                                          | **KEEP**       | Filter by rating, verified purchase badge.                                                         |
| `/seller/analytics`                              | Product sales trends & top category charts                                      | SVG charts, metric cards                                               | **POLISH**     | SVG charts use generic hex colors; align chart series with Forest Green and Terracotta tokens.     |

---

### C. Operations Web Surfaces (`apps/web/src/app/operations/*`)

| Screen / Route                       | Purpose                                           | Major Components                                       | Classification | Evidence & Action                                                                |
| :----------------------------------- | :------------------------------------------------ | :----------------------------------------------------- | :------------- | :------------------------------------------------------------------------------- |
| `/operations/login`                  | Operations staff authentication                   | Login card, error toast                                | **KEEP**       | Secure auth gating with operations role verification.                            |
| `/operations` / `/operations/orders` | Central order queue & fulfillment dispatch        | `OperationsShell`, status tabs, order table            | **KEEP**       | Rapid overview of orders needing packing and courier dispatch.                   |
| `/operations/pickups`                | Nursery pickup coordination queue                 | Pickup schedule table, nursery contact                 | **POLISH**     | Add direct nursery phone dialer link for mobile ops browser.                     |
| `/operations/packing`                | Central packaging facility hub                    | Packing checklist, barcode/order verify                | **KEEP**       | Clear item checklist per shipment.                                               |
| `/operations/deliveries`             | Courier / driver assignment and status management | Delivery assignment dropdown, out-for-delivery trigger | **POLISH**     | Assignment modal dropdown needs cleaner search filtering for large driver lists. |

---

### D. Admin Web Surfaces (`apps/web/src/app/admin/*` & `@floria/admin-web`)

| Screen / Route                      | Purpose                                                      | Major Components                                    | Classification | Evidence & Action                                                                         |
| :---------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------- | :------------- | :---------------------------------------------------------------------------------------- |
| `/admin/login`                      | Admin portal authentication                                  | Form card, security warning                         | **KEEP**       | Restricted admin auth check.                                                              |
| `/admin/dashboard`                  | Platform executive command center (GMV, sellers, orders)     | `AdminShell`, KPI grid, `LineChart`, `DonutChart`   | **POLISH**     | Replace hardcoded `#E2E8F0` and `#0F172A` with `border-floria-border` and `text-ink-900`. |
| `/admin/users`                      | Customer & user account directory                            | User table, role pill, status action                | **KEEP**       | Search by email, toggle active/suspended status.                                          |
| `/admin/sellers`                    | Nursery verification pipeline (Pending, Approved, Suspended) | Seller review cards, approve/reject/suspend modals  | **KEEP**       | Clear document review modal, instant status transition.                                   |
| `/admin/products`                   | Catalog moderation & financial calculation preview           | Product moderation table, pricing preview drawer    | **KEEP**       | Shows exact breakdown of seller base price, commission, profit, and customer price.       |
| `/admin/categories`                 | Dynamic category manager                                     | Category list, add/edit modal, slug generator       | **KEEP**       | Dynamic category creation with icon assignment.                                           |
| `/admin/orders`                     | Master platform order log & status override                  | Order table, customer info, fulfillment audit       | **KEEP**       | Master overview across all nurseries with financial breakdown.                            |
| `/admin/finance` & `/admin/payouts` | Commission tracking, ledger inspection, payout release       | Financial summary, payout approval list             | **KEEP**       | Direct ledger reconciliation with commission fee breakdown.                               |
| `/admin/promotions`                 | Platform pricing policy versioning & recalculation engine    | Policy list, version creator, recalculation trigger | **KEEP**       | Interactive pricing policy simulator and background job trigger.                          |
| `/admin/media`                      | Platform media asset library                                 | Media grid, variant viewer                          | **KEEP**       | Asset inspection with thumbnail, medium, and large WebP previews.                         |
| `/admin/reviews`                    | Review moderation & abuse reports                            | Reported reviews table, hide/delete actions         | **KEEP**       | Instant removal of offensive reviews with audit logging.                                  |
| `/admin/settings`                   | Platform fee, commission rate, and delivery fee controls     | Settings forms, commission percentage slider        | **POLISH**     | Number inputs need explicit step and unit labels (Paise / %).                             |
| `/admin/audit-logs`                 | Administrative security audit trail                          | Audit log table, JSON payload inspector             | **KEEP**       | Full actor, action, timestamp, and metadata trail.                                        |
| `/admin/system-health`              | API & database diagnostic checks                             | Health pills, response time monitor                 | **KEEP**       | Live check of PostgreSQL, Redis, and Cashfree API connectivity.                           |
| `/admin/reports`                    | Financial & operational CSV export                           | Date range picker, export buttons                   | **POLISH**     | Replace placeholder status with direct CSV download triggers.                             |

---

### E. Mobile Targets & New Experience Strategy

| Application Target                           | Planned Experience                                                       | Classification     | Design / Architecture Direction                                                                                                                     |
| :------------------------------------------- | :----------------------------------------------------------------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer Mobile** (`apps/customer-mobile`) | Native iOS/Android plant browsing, wishlist, cart, orders                | **POLISH / ADAPT** | Adapt existing Customer Web UX into native Expo Router bottom-tab navigation while preserving the warm botanical visual identity.                   |
| **Seller Mobile** (`apps/seller-mobile`)     | Fast nursery order acceptance, stock adjustment, urgent alerts           | **POLISH / ADAPT** | Streamline Seller Web dashboard into a single-thumb mobile operational hub (Order Alerts → One-tap Confirm → Quick Stock).                          |
| **Admin Mobile** (`apps/admin-mobile`)       | Emergency nursery review, critical suspension, system health alerts      | **POLISH / ADAPT** | Mobile triage view for rapid seller approval and operational incident handling.                                                                     |
| **Delivery Mobile** (`apps/delivery-mobile`) | Driver route navigation, pickup check-in, customer delivery confirmation | **NEW**            | Genuinely new mobile application experience requiring driver-centric GPS navigation, signature/photo proof of delivery, and offline delivery queue. |

---

## 3. End-to-End User Flow Audit

### Flow 1: Customer Discovery → Order Delivery

```
[Home / Shop] ──► [Product Detail] ──► [Add to Cart] ──► [Checkout] ──► [Cashfree PG] ──► [Order Tracking]
```

- **Strengths:** Seamless server-side pricing recalculation, multi-nursery cart grouping, automatic delivery benefit presentation, and Cashfree checkout modal.
- **Identified Friction:** The address creation modal during checkout should preserve partially typed form state if the user dismisses the dialog accidentally.

### Flow 2: Seller Registration → Product Cataloging → Fulfillment

```
[Seller Register] ──► [KYC Upload] ──► [Admin Approval] ──► [Add Product + Photos] ──► [Order Alert] ──► [Fulfillment Steps]
```

- **Strengths:** Protected multi-stage nursery onboarding; unapproved sellers cannot publish items or accept orders until verified.
- **Identified Friction:** The product image uploader could display the primary thumbnail badge more prominently during multi-file selection.

### Flow 3: Admin Platform Oversight & Pricing Policy Activation

```
[Admin Login] ──► [Dashboard] ──► [Sellers / Products Moderation] ──► [Pricing Policy Versioning] ──► [Audit Logs]
```

- **Strengths:** Direct insight into GMV, net revenue, active sellers, and audit logging for every administrative action.

---

## 4. Design System Compliance Findings (vs `DESIGN.md`)

- **Compliant Areas:**
  - Core color palette (Forest Green `#1E3A2B`, Terracotta `#943828`, Warm Sand surfaces `#F9F8F3`, `#FBF8F1`, `#EFE8DC`) is consistently applied in customer storefront, product cards, and seller shells.
  - Typography correctly loads Cormorant Garamond, Playfair Display, Manrope, and DM Sans.
  - Reduced-motion media query overrides exist in `globals.css`.
- **Inconsistencies to Polish:**
  - Admin dashboard (`apps/web/src/app/admin/dashboard/page.tsx`) contains arbitrary Tailwind slate hex codes (`#E2E8F0`, `#0F172A`) that should be replaced with `border-floria-border` and `text-ink-900`.
  - Seller profile forms use default browser focus borders in some legacy sub-components; standard `focus-visible:ring-forest-800` should be applied universally.

---

## 5. Stitch Design Backlog

When Google Stitch is utilized in future UI design phases, target screens are prioritized as follows:

### STITCH PRIORITY 1 (High-Impact New Experiences & Refinements)

1. **Delivery Mobile Driver Execution Flow (`apps/delivery-mobile`)**
   - **User Role:** Delivery Partner.
   - **Objective:** Design driver task flow: Active Route Map → Nursery Pickup Check-in → Order Packaging Verification → Customer Drop-off & Proof of Delivery.
   - **Requirements:** High-contrast daylight UI, massive 48px+ touch targets, dark-mode/sunlight resilience, botanical accent trim.

### STITCH PRIORITY 2 (Meaningful Polish & Mobile Adaptations)

2. **Seller Mobile Operational Cockpit (`apps/seller-mobile`)**
   - **User Role:** Nursery Owner.
   - **Objective:** Streamlined mobile view for immediate order confirmation, photo uploads directly from camera, and 1-tap stock increments.
3. **Admin Mobile Emergency Triage View (`apps/admin-mobile`)**
   - **User Role:** Platform Super Admin.
   - **Objective:** Mobile-optimized seller verification queue and live platform status cards.

### STITCH PRIORITY 3 (Optional Explorations)

4. **Interactive Plant Care Guide & Augmented Placement Exploration (Customer Storefront)**

### NO STITCH NEEDED (Preserve Existing Production UI)

- Customer Homepage (`/`)
- Product Catalog & Search (`/shop`, `/search`, `/categories`)
- Product Details (`/products/[slug]`)
- Multi-Nursery Cart (`/cart`)
- Checkout & Cashfree Payment Launcher (`/checkout`)
- Order History & Tracking (`/orders`, `/orders/[id]`)
- Wishlist & Account (`/wishlist`, `/account`)
- Full Seller Web Portal (`/seller/*`)
- Full Admin Web Center (`/admin/*`)
- Full Operations Logistics Hub (`/operations/*`)
