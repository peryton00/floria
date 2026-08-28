# Floria — Production Pre-Flight Checklist

This checklist must be audited and verified before declaring Floria ready for production deployment.

---

## 1. Infrastructure & Deployment Setup

- [x] Web Frontend (`apps/web`) configured for production build (`pnpm build`).
- [x] Backend REST API (`backend/api`) configured for Render deployment (`render.yaml`).
- [x] Express API uses dynamic `PORT` provided by environment (`process.env.PORT`).
- [x] `GET /health` liveness endpoint implemented and verified (`200 OK`).
- [x] `GET /ready` database connectivity readiness endpoint implemented and verified.

## 2. Secrets & Git Security

- [x] `.gitignore` verified to exclude `.env`, `.env.local`, `.env.production`.
- [x] `apps/web/list-users.js` audited and cleaned of hardcoded `serviceRoleKey`.
- [x] `scripts/seed-live-db.js`, `apps/web/seed-live-db.js`, and `scripts/seed-database.mjs` audited and updated to read keys from `process.env`.
- [x] No `SUPABASE_SERVICE_ROLE_KEY` or raw JWT secrets exposed in client-side bundles or source code.
- [x] `.env.example` templates created and updated across root and backend workspaces.

## 3. Security, RBAC & API Rules

- [x] `SUPABASE_SERVICE_ROLE_KEY` restricted to server-side backend API and proxy routes.
- [x] Customer identity derived server-side from `auth.uid()` (never trusted from request body).
- [x] Seller identity derived server-side from `auth.uid() -> seller_profiles.id` (never trusted from request body).
- [x] Admin routes protected with server-side RBAC role check (`role === 'admin'`).
- [x] Operations routes protected with server-side RBAC role check (`role === 'operations'`).
- [x] CORS configured with strict domain matching (`CORS_ALLOWED_ORIGINS`). No wildcard `*` allowed for authenticated APIs.
- [x] Security headers enforced (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
- [x] Error responses sanitized in production (no stack traces, database queries, or internal file paths returned).

## 4. Rate Limiting, Logging & Monitoring

- [x] Auth rate limiting configured (`authRateLimiter` 10 req/min).
- [x] Checkout rate limiting configured (`checkoutRateLimiter` 10 req/min).
- [x] Seller fulfillment rate limiting configured (`sellerFulfillmentRateLimiter` 30 req/min).
- [x] Public catalog rate limiting configured (`publicCatalogRateLimiter` 120 req/min).
- [x] Request correlation middleware implemented with `X-Request-ID` tracing on every request.
- [x] Structured JSON logger implemented (never logs passwords, JWTs, or secrets).

## 5. Storage, Auth & Mobile Readiness

- [x] Supabase Storage buckets segregated: `product-images` (Public) vs `seller-documents` (Private).
- [x] Supabase Auth configured for Email/Password and Google OAuth.
- [x] Universal API Client (`@floria/api-client`) built and ready for Flutter mobile integration via `/api/v1/*` REST endpoints.

## 6. Verification & Quality

- [x] TypeScript build passes with **0 errors** across `@floria/api`, `@floria/web`, `@floria/api-client`, `@floria/types`.
- [x] Automated storefront discovery verification script (`verify_phase_3_15_direct.ts`) passes 100%.
- [x] CI/CD pipeline defined in `.github/workflows/ci.yml`.
