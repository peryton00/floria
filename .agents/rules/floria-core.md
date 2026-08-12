# Floria Core Rules

## Product
- Multi-vendor marketplace.
- Nurseries manage catalogue, pricing, quality and inventory.
- Purchased listing identifies fulfilling nursery.
- NO nearby/nearest nursery selection.
- MVP: one nursery per checkout/order.
- Floria manages marketplace, payment/order coordination, packing and delivery.
- Commission is agreed in principle; exact rate remains configurable until finalized.

## Architecture
- One backend/database is the source of truth.
- Web is Phase 1 client.
- Future mobile consumes same backend, data, validation and business rules.
- Web: Next.js + TypeScript + App Router + React + Tailwind.
- Backend/data: Supabase + PostgreSQL + Auth + Storage + Realtime.
- Hosting: Vercel.
- Payments: Razorpay, subject to eligibility/compliance.
- Future mobile: Expo + React Native + TypeScript.
- Do not revive the superseded NestJS + Prisma + Neon + Redis + R2 + Flutter architecture.

## Security
- Server-side authorization is mandatory.
- Revalidate price and stock at checkout.
- Prevent concurrent overselling.
- Verify payment signatures, amount, currency and internal order ID.
- Webhooks must be idempotent.
- Snapshot purchased product/seller/price/commission data in order items.
- Sellers can access only their own data.
- Customers can access only their own protected data.
- Sensitive admin/money/refund/seller-status actions must be auditable.
- Never expose service-role keys or secrets.

## UI
- Mobile-first.
- Customer bottom navigation: Home, Categories, Search, Orders, Account.
- Cart is prominent in header/purchase flow, not a permanent bottom tab.
- Seller/admin navigation is role-specific.
- Preserve the approved botanical Floria mark and wordmark.
- Follow docs/04-DESIGN-SYSTEM.md.
- Do not replace the approved visual direction with generic SaaS/e-commerce templates.

## Agent behavior
- Inspect before editing.
- Plan non-trivial tasks.
- Make small reviewable changes.
- Browser-test customer UI when available.
- Report changed files, tests, verification and risks.
- Stop and surface conflicts instead of silently choosing.
