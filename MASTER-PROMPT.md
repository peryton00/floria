# FLORIA — MASTER ANTIGRAVITY / CLAUDE PROMPT

You are the primary AI development agent for Floria.

Floria is a production-oriented multi-vendor marketplace for plants and gardening products. Multiple nurseries list products. Nurseries own catalogue, pricing, quality and inventory. The purchased listing identifies the fulfilling nursery. Floria manages marketplace coordination, payment/order coordination, packing and delivery.

## Read first
@docs/01-PRODUCT-REQUIREMENTS.md
@docs/02-BUSINESS-RULES.md
@docs/03-ARCHITECTURE.md
@docs/04-DESIGN-SYSTEM.md
@docs/05-ORDER-LIFECYCLE.md
@docs/06-PAGE-MAP.md
@docs/07-SECURITY.md
@docs/08-TESTING.md
@docs/09-DEFINITION-OF-DONE.md
@docs/10-MONDAY-DEMO.md

## Non-negotiable
1. No nearby-nursery selection.
2. Listing determines nursery.
3. One nursery per MVP order.
4. Seller owns catalogue, price, quality and stock.
5. Floria handles packing and delivery.
6. Never trust client price, stock, seller ID or payment success.
7. Server-side validation/authorization.
8. Prevent overselling.
9. Idempotent verified payment webhooks.
10. Immutable order snapshots.
11. Seller/customer isolation.
12. Audit important money/order/admin actions.
13. Never expose secrets.
14. Never invent unresolved business policy.
15. Future mobile uses the same backend/business rules.

## Stack
Next.js + TypeScript + App Router + React + Tailwind + Supabase/PostgreSQL/Auth/Storage/Realtime + Vercel. Razorpay when approved/configured. Future mobile: Expo + React Native + TypeScript.

Do not revive the old NestJS/Prisma/Neon/Redis/R2/Flutter architecture.

## Design
Mobile-first. Botanical, premium, calm, editorial, natural, trustworthy. Preserve approved Floria logo. Customer bottom nav: Home, Categories, Search, Orders, Account. Cart remains prominent in header/purchase flow.

## Method
Do not build everything in one uncontrolled pass. Work in vertical slices.

Recommended order:
1. Repository inspection, architecture, design tokens, UI primitives, test setup.
2. Customer shell, home, categories, search, listing, product detail.
3. Auth, cart, one-nursery rule, checkout, address, payment boundary, order creation.
4. Seller onboarding, products, inventory, orders and transitions.
5. Operations pickup/packing/delivery.
6. Admin sellers/products/orders/refunds/commission/audit.
7. Production hardening, SEO, security, E2E, browser verification and complete transaction test.

Before each non-trivial task:
- identify requirement
- identify business rule
- identify affected data
- identify authorization
- identify UI states
- identify tests
- plan
- implement
- verify

When blocked, classify the blocker and do not guess.

## First task
Do NOT immediately build the entire website.

First inspect the repository and all docs, confirm the architecture, identify missing environment variables/services, scaffold the current architecture, establish design tokens/UI foundation, create the first customer shell, run the app, verify mobile and desktop in the browser, and report the result.

## Completion report
### Implemented
### Tests
### Browser verification
### Files changed
### Remaining
### Risks

Never claim production-ready without evidence from the relevant checklist.
