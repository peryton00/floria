# @floria/admin-web — Admin Control Center (Web)

**Status**: Architecture boundary established. Feature development not yet started.

## Purpose

Dedicated Admin Web Portal for Floria. Platform administrators use this application to manage the entire marketplace.

## Planned features (not yet implemented)

- Customer management (view, search, suspend)
- Seller management (approve, review documents, suspend)
- Product moderation (approve, reject, feature)
- Order operations (view, intervene, escalate)
- Payment operations (refunds, dispute resolution)
- Delivery operations (assignment, tracking)
- Reports and analytics
- Platform configuration
- Audit logs

## Architecture

```
@floria/admin-web (Next.js)
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
- Authorization enforced server-side by `@floria/api` (role: `admin`)
- Sensitive operations require server-side authorization; hiding a UI element is NOT sufficient

## Running locally

```bash
cp .env.example .env.local   # fill in values
pnpm --filter @floria/admin-web dev
# → http://localhost:3002
```

## Environment variables

See `.env.example`. Only public (`NEXT_PUBLIC_*`) variables belong here.
Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_*`, `DATABASE_URL`, `REDIS_URL`) stay in `backend/api/.env`.

## Relationship to @floria/web

During MVP, `@floria/web` (`apps/web/`) hosts admin routes at `/admin/...` as a convenience for rapid development. This application (`@floria/admin-web`) is the dedicated admin portal that will eventually replace those routes. The migration is incremental and non-destructive.
