# @floria/seller-web — Seller Portal (Web)

**Status**: Architecture boundary established. Feature development not yet started.

## Purpose

Dedicated Seller Web Portal for Floria. Sellers (nursery owners) use this application to manage their store, products, inventory, orders, and payouts.

## Planned features (not yet implemented)

- Dashboard with sales KPIs
- Store profile management
- Product management (create, edit, publish, archive)
- Inventory tracking and low-stock alerts
- Order management and fulfillment workflows
- Payout tracking
- Analytics and reports
- Seller settings and document management

## Architecture

```
@floria/seller-web (Next.js)
         │
         ▼
@floria/api-client
         │
         ▼
@floria/api (Express — single backend)
         │
         ▼
  Supabase PostgreSQL
```

**Rules:**

- All data access goes through `@floria/api-client` → `@floria/api`
- No direct PostgreSQL access from this application
- No business logic duplicated from `@floria/api`
- Authorization enforced server-side by `@floria/api`

## Running locally

```bash
cp .env.example .env.local   # fill in values
pnpm --filter @floria/seller-web dev
# → http://localhost:3001
```

## Environment variables

See `.env.example`. Only public (`NEXT_PUBLIC_*`) variables belong here.
Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_*`, `DATABASE_URL`, `REDIS_URL`) stay in `backend/api/.env`.

## Relationship to @floria/web

During MVP, `@floria/web` (`apps/web/`) hosts seller routes at `/seller/...` as a convenience for rapid development. This application (`@floria/seller-web`) is the dedicated seller portal that will eventually replace those routes. The migration is incremental and non-destructive.
