# Floria Design System & Visual Specification (DESIGN.md)

> **Source of Truth:** The existing Floria production website (`apps/web`) is the canonical visual reference and design foundation for all Floria applications (Customer Web, Customer Mobile, Seller Web, Seller Mobile, Admin Web, Admin Mobile, Delivery Mobile).

---

## 1. Visual Atmosphere & Philosophy

- **Atmosphere:** Botanical, Editorial, Natural, Premium, Calm, Tactile, and Trustworthy.
- **Density:** Daily App Balanced (Scale: 5/10). Ample breathing room with high information legibility.
- **Variance:** Offset Asymmetric & Curated Editorial (Scale: 7/10). Avoids flat, repetitive SaaS grids in favor of organic visual pacing, high-contrast typography, and curated product storytelling.
- **Motion:** Natural Botanical Ease (Scale: 5/10). Restrained, physics-grounded transitions with subtle ambient life (botanical sway, heart-pop, badge pulse).

---

## 2. Color Palette & Roles

Floria’s palette is inspired by lush plant canopies, rich terracotta pottery, earthy sage foliage, and warm sandy soil.

### Core Brand Tokens

- **Forest Green (Primary Base):** `#1E3A2B` (`--floria-forest` / `forest-800`) — Primary branding, display headings, dark buttons, active navigation states.
- **Terracotta (Primary Accent / CTA):** `#943828` (`--floria-terracotta` / `terracotta-700`) — Primary conversion actions (Add to Cart, Checkout, Buy Now, urgent alerts, sale badges).
- **Olive Sage (Secondary Brand):** `#4A5D4E` (`--floria-sage` / `sage-600`) — Secondary buttons, filter headers, metadata chips, nursery badges.
- **Soft Botanical Green (Light Accent):** `#DDE7DD` (`--floria-botanical` / `forest-100`) — Soft highlights, active filter backgrounds, success badges.

### Surface Hierarchy (Warm Sand & Cream)

- **Main Page Background:** `#F9F8F3` (`--floria-page` / `cream-100`) — Warm cream canvas, soothing and anti-glare.
- **Elevated Linen:** `#FBF8F1` (`--floria-linen` / `cream-50`) — Cards, modals, drawers, dropdowns, floating summary panels.
- **Soft Sand:** `#F6F1E7` (`--floria-soft-sand` / `cream-200`) — Secondary card blocks, filter areas, tab bar backgrounds.
- **Sand:** `#EFE8DC` (`--floria-sand` / `cream-300`) — Input fields, search bars, muted containers, category pill buttons.
- **Natural Sand:** `#E9E1D3` (`--floria-natural-sand` / `cream-400`) — Product image frames, media staging backgrounds, placeholder containers.
- **Divider Linen (Border):** `#E2D9CC` (`--floria-border` / `ink-150`) — 1px structural borders, card outlines, table separators.

### Typography Ink Tokens

- **Charcoal (Text Primary):** `#212529` (`--floria-text-primary` / `ink-900`) — High legibility, warm off-black for body copy and headings.
- **Muted Gray-Green (Text Secondary):** `#6C756F` (`--floria-text-secondary` / `ink-500`) — Secondary labels, descriptions, dates, helper text.
- **Deep Canopy (Dark Backgrounds):** `#1E3A2B` / `#15291E` — Footer, dark promotional bands, splash screens.

### Status Colors

- **Success:** `#2B6E3F` (Bg: `#DDE7DD`) — Confirmed orders, in-stock badges, active seller approvals.
- **Warning:** `#A05B1E` (Bg: `#FCEFD9`) — Low stock alerts, pending approvals.
- **Error / Destruction:** `#A82E2E` (Bg: `#FDE8E8`) — Payment failed, out-of-stock badges, delete actions.
- **Info:** `#245D8C` (Bg: `#E0F0FC`) — Delivery tracking updates, system notifications.

---

## 3. Typography Rules & Font Hierarchy

Floria combines an elegant classical editorial serif for storytelling display with an ultra-clean, legible modern sans-serif for UI, numbers, and data.

### Font Stacks

1. **Display / Headlines (`h1`, `h2`, `h3`):** `"Cormorant Garamond", Georgia, serif`
   - Weight: `500` (Medium) or `600` (SemiBold).
   - Line height: `1.15 – 1.25`. Letter-spacing: `-0.01em` (track-tight).
   - Used for: Hero statements, section titles, product names on detail pages, editorial callouts.
2. **Editorial Serif (`--font-editorial`):** `"Playfair Display", serif`
   - Used sparingly for quotes, testimonials, and premium marketing badges.
3. **Body Text (`--font-body`):** `"Manrope", -apple-system, BlinkMacSystemFont, sans-serif`
   - Weight: `400` (Regular), `500` (Medium).
   - Line height: `1.5 – 1.6`. Max line length: `65ch`.
   - Used for: Product descriptions, reviews, paragraphs, articles.
4. **UI, Buttons, Inputs, Tables & Badges (`--font-ui`):** `"DM Sans", sans-serif`
   - Weight: `500` (Medium), `600` (SemiBold), `700` (Bold).
   - Used for: Buttons, navigation labels, input text, table cells, metric values, prices.

### Anti-Patterns

- `Inter` is banned for display and core marketing typography.
- Generic browser serif (`Times New Roman`) is banned.
- Pure black (`#000000`) text is banned — always use Charcoal (`#212529`).

---

## 4. Spacing Scale & Border Radius

### Spacing Scale (4px Base)

- `space-1` = `0.25rem` (4px)
- `space-2` = `0.5rem` (8px)
- `space-3` = `0.75rem` (12px)
- `space-4` = `1.0rem` (16px)
- `space-5` = `1.25rem` (20px)
- `space-6` = `1.5rem` (24px)
- `space-8` = `2.0rem` (32px)
- `space-10` = `2.5rem` (40px)
- `space-12` = `3.0rem` (48px)
- `space-16` = `4.0rem` (64px)
- `space-20` = `5.0rem` (80px)
- `space-24` = `6.0rem` (96px)

### Border Radius Tokens

- `sm` = `0.25rem` (4px) — Badges, small pills, checkboxes.
- `md` = `0.5rem` (8px) — Buttons, form inputs, small cards.
- `lg` = `0.75rem` (12px) — Standard cards, dropdowns, floating panels.
- `xl` = `1.0rem` (16px) — Large cards, product cards, image containers.
- `2xl` = `1.5rem` (24px) — Hero containers, modals, bottom sheets.
- `full` = `9999px` — Circular avatars, icon buttons, pill tags.

---

## 5. Shadows & Elevation

Restrained, warm botanical diffusion (never harsh black or neon glow).

- **`shadow-2xs` / `shadow-xs`:** `0 1px 2px 0 rgb(33 37 41 / 0.05)` — Subtle cards, table rows.
- **`shadow-sm`:** `0 1px 4px 0 rgb(33 37 41 / 0.07), 0 1px 2px -1px rgb(33 37 41 / 0.05)` — Inputs on focus, filter chips.
- **`shadow-md`:** `0 4px 12px -2px rgb(33 37 41 / 0.08), 0 2px 4px -2px rgb(33 37 41 / 0.05)` — Card hover state, dropdown menus.
- **`shadow-lg`:** `0 10px 24px -4px rgb(33 37 41 / 0.10), 0 4px 8px -4px rgb(33 37 41 / 0.05)` — Floating cart summary, header blur on scroll.
- **`shadow-xl`:** `0 20px 40px -8px rgb(33 37 41 / 0.12), 0 8px 16px -8px rgb(33 37 41 / 0.05)` — Dialog modals, notification drawers.

---

## 6. Component Behaviors & Styling

### 1. Buttons

- **Primary Action (CTA):** Terracotta (`bg-terracotta-700`), white text, hover `bg-terracotta-800`, active `bg-terracotta-900`, focus ring `ring-terracotta-700`.
- **Brand Primary:** Forest Green (`bg-forest-800`), white text, hover `bg-forest-900`.
- **Secondary:** Sage Green (`bg-sage-600`), white text, hover `bg-sage-700`.
- **Muted / Outline:** Warm Sand background (`bg-cream-200`) or 1px border (`border-floria-border`), dark text.
- **Touch Target:** Minimum `44px` height (`h-11` or `h-13`) to ensure touch accessibility on mobile.
- **Micro-interaction:** Subtle `-0.5px` translate on hover, `scale(0.98)` on active press.

### 2. Form Inputs & Controls

- **Surface:** Sand (`#EFE8DC`) or Elevated Linen (`#FBF8F1`), border `1px solid #E2D9CC`.
- **Height:** `h-11` (44px) standard.
- **Focus:** `outline: none; ring: 2px solid #1E3A2B; ring-offset: 2px;`.
- **Typography:** DM Sans, 14px/15px, `#212529`. Placeholder: `#6C756F`.
- **Labels:** Positioned cleanly above input with `text-xs font-semibold uppercase tracking-wider text-ink-700`.

### 3. Product Cards

- **Structure:** Elevated Linen card (`#FFFFFF` / `#FBF8F1`), `1px solid #E2D9CC/80`, `rounded-xl`.
- **Image Container:** 1:1 square ratio with Natural Sand background (`#E9E1D3`), subtle 500ms image zoom on hover (`scale-105`).
- **Badges:** Max 2 compact uppercase badges in top-left (`FREE DELIVERY`, `15% OFF`, `BEST SELLER`).
- **Wishlist Heart:** Floating circular glass pill (`bg-white/90 backdrop-blur-md`) in top-right with tactile heart-pop animation.
- **Content:** Nursery name (`text-xs text-sage-600`), botanical product name (`font-serif text-base font-semibold text-forest-800`), rating stars, and dynamic server-calculated price with delivery benefit note.

### 4. Navigation & Layout Shells

- **Customer Web:** Sticky header (64px) on warm canvas with search input, nursery discovery link, cart pill with item count badge, and user menu.
- **Mobile Apps:** Fixed top header (64px) + fixed bottom nav (64px) with icons for Home, Search, Cart, Orders, and Profile.
- **Seller Portal:** Left sidebar on elevated linen with olive sage and forest green active indicators.
- **Admin Center:** Clean botanical management view with metric cards, moderation queues, and financial audit logs.

### 5. Loading & Skeleton System

- **Shimmer Skeletons:** Animated warm sand pulse (`bg-cream-300/60` with smooth CSS gradient sweep).
- **Dimension Matching:** Skeletons match exact component heights and layout grids to eliminate layout shift (CLS).
- **Reduced Motion:** Gracefully falls back to static low-contrast placeholders when `prefers-reduced-motion: reduce` is active.

---

## 7. Motion & Micro-Interactions

- **Botanical Sway:** Ambient, gentle plant swaying animation for decorative hero illustrations (10s cubic-bezier loop).
- **Heart Pop:** 200ms spring scale animation (`scale: 1 -> 1.15 -> 1`) when favoriting products.
- **Badge Pulse:** 200ms subtle scale pop when cart item count changes.
- **Fade Up:** 300ms cubic-bezier entrance for modals and content tabs.
- **Hardware Acceleration:** All animations strictly operate on `transform` and `opacity`.

---

## 8. Explicit Anti-Patterns (Forbidden)

1. **NO AI Purple / Blue Neon:** Neon glows, dark-purple gradients, or high-tech cyber glows are strictly forbidden.
2. **NO Generic SaaS Grids:** Do not create cold, gray, bootstrap-like dashboard templates. Every screen must feel botanical, warm, and distinctly Floria.
3. **NO Pure Black (`#000000`):** Use Charcoal (`#212529`) or Deep Forest (`#1E3A2B`).
4. **NO Pure Bleached White Page Canvas:** Main background must always be Warm Cream (`#F9F8F3`).
5. **NO Unstyled Emoji in UI:** Use SVG line icons with consistent 1.5px–2px stroke.
6. **NO Generic Default Sans Fonts:** Do not fall back to browser default fonts or unconfigured Arial/Helvetica.

---

## 9. Multi-App Consistency Matrix

| Application         | Core Role / Primary Jobs                                                       | Visual Language Alignment                                               |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Customer Web**    | Browsing, search, cart, checkout, plant care discovery                         | Full editorial warmth, rich product cards, Cormorant Garamond headings. |
| **Customer Mobile** | Native iOS/Android plant shopping, quick order tracking                        | Bottom-nav tabs, high touch-target cards, tactile heart-pop.            |
| **Seller Web**      | Product cataloging, stock management, order fulfillment, nursery payouts       | Clean table layouts, Sage/Forest action buttons, warm linen surfaces.   |
| **Seller Mobile**   | Rapid order acceptance, instant stock adjustments, fulfillment status          | High-contrast status badges, single-thumb operational controls.         |
| **Admin Web**       | User approvals, product moderation, pricing policy overrides, financial ledger | Dense metrics cards, audit tables, botanical restraint.                 |
| **Admin Mobile**    | Critical nursery approval triage, emergency suspension, system health alerts   | Urgent status indicators, clear approval/rejection CTAs.                |
| **Delivery Mobile** | Route navigation, nursery pickup confirmation, proof of delivery               | High-contrast delivery status cards, big tactile completion buttons.    |
