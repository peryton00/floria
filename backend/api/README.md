# @floria/api — Backend REST API Service

The central backend REST API and background worker service for the Floria Platform.

## Quick Links
- **Full Architecture & Endpoint Specification**: [docs/architecture/backend-api-specification.md](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/docs/architecture/backend-api-specification.md)

## Tech Stack
- **Framework**: Express 4 with TypeScript
- **Database / Auth**: Supabase PostgreSQL with RLS + Standalone Seller Auth
- **Queue / Async Jobs**: Redis + BullMQ
- **Image Processing**: Sharp
- **Validation**: Zod 3.24

## Getting Started

### Development
```bash
# Start backend in hot-reload mode
pnpm dev
# Or from root
pnpm --filter @floria/api dev
```

### Build & Run
```bash
pnpm build
pnpm start
```

### Testing & Typecheck
```bash
pnpm typecheck
pnpm test
```

## API Route Structure
- `/api/v1/auth` — Auth verification & Seller credentials
- `/api/v1/catalog/products` & `/api/v1/catalog/categories` — Public storefront browsing
- `/api/v1/customer/*` — Cart, Wishlist, Checkout, Orders, Addresses & Profile
- `/api/v1/seller/*` — Nursery profile, products, inventory, fulfillment & payouts
- `/api/v1/operations/*` — Hub dispatch, pickups, packing, and POD delivery
- `/api/v1/admin/*` — Moderation, user/seller management, financial engine & pricing policies
- `/api/v1/payments/*` — Cashfree payment sessions, webhooks & refunds
- `/api/v1/media/*` — Chunked / direct uploads & Sharp asset transformations
- `/api/v1/notifications/*` — In-app notification center & SSE real-time stream
