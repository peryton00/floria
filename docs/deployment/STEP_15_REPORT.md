# Floria — Step 15 Production Readiness, Deployment Validation & GitHub Preparation Report

**Authoritative Roadmap Milestone:** Step 15 — Real Production Smoke Testing & GitHub Preparation
**Date:** August 2026
**Status:** Multi-Environment Empirical Verification Baseline
**Final Gate Recommendation:** **PRODUCTION VERIFIED WITH CONDITIONS**

---

## 1. Current Deployment Architecture

The Floria platform is currently operating in an intentional intermediate multi-application transition architecture:

```text
                    FLORIA PLATFORM
                           │
            ┌──────────────┴──────────────┐
            │                             │
          Vercel                        Render
            │                             │
            ▼                             ▼
       Customer Web                  Express API
  floriaa-web.vercel.app        floria-api.onrender.com
                                          │
                           ┌──────────────┼──────────────┐
                           ▼              ▼              ▼
                        Supabase       Cashfree        Storage
                        PostgreSQL     Gateway        Pipeline
```

### Deployed vs Local Breakdown

- **Currently Hosted Production**:
  - Customer Web: `https://floriaa-web.vercel.app` (Vercel Edge)
  - Backend REST API: `https://floria-api.onrender.com` (Render Web Service)
- **Local / Pending Independent Deployment**:
  - Seller Web (`apps/seller-web`) — Next.js 16
  - Admin Web (`apps/admin-web`) — Next.js 16
  - Customer Mobile (`apps/customer-mobile`) — Expo SDK 57 / React Native 0.86.3
  - Seller Mobile (`apps/seller-mobile`) — Expo SDK 57 / React Native 0.86.3
  - Admin Mobile (`apps/admin-mobile`) — Expo SDK 57 / React Native 0.86.3
  - Delivery Mobile (`apps/delivery-mobile`) — Expo SDK 57 / React Native 0.86.3

---

## 2. Vercel Customer Web Verification

- **Hosted URL**: `https://floriaa-web.vercel.app`
- **DNS / HTTPS Status**: Resolved via Vercel Edge with valid SSL certificate.
- **HTTP Response**: `HTTP 200 OK` (Latency: ~1698ms).
- **Page Rendering**: Server-side rendered HTML structure confirmed intact with metadata, viewport configuration, and preloaded assets.
- **JavaScript Execution**: Next.js client bundles loaded successfully.
- **Classification**: **PASS (HOSTED PRODUCTION)**

---

## 3. Render API Verification

- **Hosted Health Endpoint**: `https://floria-api.onrender.com/health`
  - Status: `HTTP 200 OK` (Latency: ~1814ms)
  - Response Body: `{"status":"healthy","service":"floria-api","timestamp":"2026-08-28T18:55:37.524Z"}`
- **Hosted Readiness Endpoint**: `https://floria-api.onrender.com/ready`
  - Status: `HTTP 200 OK` (Latency: ~2038ms)
  - Response Body: `{"status":"ready","database":"connected"}`
- **Live Catalog Queries**:
  - `GET /api/v1/catalog/categories` $\rightarrow$ `HTTP 200 OK` (9 active categories retrieved from Supabase PostgreSQL).
  - `GET /api/v1/catalog/products` $\rightarrow$ `HTTP 200 OK` (9 active products with nested category data retrieved).
- **Classification**: **PASS (HOSTED PRODUCTION)**

---

## 4. Customer Web → API Verification

- **Network Inspection of Live Bundle**: Analyzed the scripts served by `https://floriaa-web.vercel.app`.
- **API Target**: Verified client bundles configure runtime API requests to `https://floria-api.onrender.com`.
- **Zero Localhost Leakage**: Audited client bundles for accidental `localhost:4000`, `127.0.0.1`, or development endpoints — 0 localhost references present in production JavaScript chunks.
- **Classification**: **PASS (HOSTED PRODUCTION)**

---

## 5. Local Seller Web Verification

- **Package**: `@floria/seller-web` (`apps/seller-web`)
- **Status**: Not yet independently deployed.
- **Local Dev Runtime**: Nursery dashboard, live order queue, inventory stock adjuster, earnings analytics, and seller profile forms verified locally.
- **Automated Tests**: 15 unit/integration tests passing.
- **Production Build**: Next.js 16 Turbopack production build compiled successfully.
- **Classification**: **LOCAL RUNTIME VERIFIED (NOT DEPLOYED)**

---

## 6. Local Admin Web Verification

- **Package**: `@floria/admin-web` (`apps/admin-web`)
- **Status**: Not yet independently deployed.
- **Local Dev Runtime**: KYC partner verification workflows, catalog moderation, pricing policy controls, operations dispatch, and system audit logs verified locally.
- **Automated Tests**: 8 unit/integration tests passing.
- **Production Build**: Next.js 16 Turbopack production build compiled successfully.
- **Classification**: **LOCAL RUNTIME VERIFIED (NOT DEPLOYED)**

---

## 7. Mobile Configuration Verification

- **Packages**:
  - `apps/customer-mobile` (12 tests passing)
  - `apps/seller-mobile` (10 tests passing)
  - `apps/admin-mobile` (9 tests passing)
  - `apps/delivery-mobile` (7 tests passing)
- **Target Release Endpoint**: Configured to read `EXPO_PUBLIC_API_URL` falling back to `https://floria-api.onrender.com` in release configurations.
- **Status**: Development builds active; store releases intentionally deferred to future release phase.
- **Classification**: **LOCAL RUNTIME VERIFIED (NOT DEPLOYED)**

---

## 8. Authentication

- **Provider**: Supabase Auth (JWT bearer tokens).
- **Client Handling**: `@floria/api-client` injects `Authorization: Bearer <token>` into all requests.
- **Server Verification**: Express `authenticateToken` middleware parses and cryptographically validates JWTs against Supabase public keys with sub/role claims.
- **Classification**: **PASS (HOSTED & LOCAL)**

---

## 9. Authorization (RBAC)

- **Security Boundary**: Server-authoritative role verification via `requireRole(...)` middleware on `@floria/api`.
- **Role Hierarchy**: `customer`, `seller`, `operations`, `admin`.
- **Tested Scenarios**: Verified that non-admins are rejected with 403 FORBIDDEN when attempting to access `/api/v1/admin/*` routes or seller inventory routes belonging to other sellers.
- **Classification**: **PASS (AUTOMATED TEST VERIFIED)**

---

## 10. Cashfree Gateway Configuration

- **Provider**: Cashfree Payment Gateway SDK (`2023-08-01` API).
- **Environment**: Configurable via `CASHFREE_ENVIRONMENT` (`SANDBOX` / `PRODUCTION`).
- **Live Real-Money Transaction**: **NOT VERIFIED** (Intentionally deferred for financial safety without explicit user authorization).
- **Classification**: **CONFIGURED / LIVE CHARGE NOT VERIFIED**

---

## 11. Cashfree Webhook Handling

- **Route**: `POST /api/v1/payments/webhooks/cashfree`
- **Security**: HMAC-SHA256 signature verification (`x-webhook-signature` & `x-webhook-timestamp` replay window check).
- **Idempotency**: In-memory event cache + database `payment_events` provider event ID deduplication.
- **State Transitions**: Validates order state updates from `pending` to `paid` or `failed`.
- **Classification**: **PASS (AUTOMATED TEST VERIFIED)**

---

## 12. Storage

- **Buckets**: `product-media`, `nursery-branding`, `delivery-pod`, `private-documents`.
- **Security**: Public read for catalog images; signed URLs with strict RLS for documents and proof of delivery images.
- **Classification**: **PASS (HOSTED & LOCAL)**

---

## 13. Server-Sent Events (SSE)

- **Endpoints**: `/api/v1/notifications/stream`, `/api/v1/operations/stream`.
- **Behavior**: Authenticated persistent connection with heartbeat pinging every 15 seconds.
- **Classification**: **PASS (AUTOMATED TEST VERIFIED)**

---

## 14. Security & Headers

- **Headers**: Helmet security middleware configured (HSTS, X-Content-Type-Options, X-Frame-Options, Content Security Policy).
- **CORS**: Restricted origins supporting `floriaa-web.vercel.app` and localhost during development.
- **Classification**: **PASS**

---

## 15. Automated Tests

- Full automated test suite executed across the entire repository:
  - `@floria/api`: 181 tests passing (17 test files)
  - `@floria/web`: 75 tests passing (8 test files)
  - `@floria/seller-web`: 15 tests passing (1 test file)
  - `@floria/admin-web`: 8 tests passing (1 test file)
  - `@floria/customer-mobile`: 12 tests passing (1 test file)
  - `@floria/seller-mobile`: 10 tests passing (1 test file)
  - `@floria/admin-mobile`: 9 tests passing (1 test file)
  - `@floria/delivery-mobile`: 7 tests passing (1 test file)
- **Total Tests Passing**: **317 tests passing, 0 failures**.
- **Classification**: **PASS**

---

## 16. TypeScript Typecheck

- Ran `tsc --noEmit` across all 11 monorepo packages.
- **Result**: **0 TypeScript compilation errors**.
- **Classification**: **PASS**

---

## 17. Production Builds

| Package              | Framework / Target       | Build Status |
| :------------------- | :----------------------- | :----------: |
| `@floria/api-client` | `tsup` (CJS + ESM + DTS) |   **PASS**   |
| `@floria/api`        | TypeScript `tsc`         |   **PASS**   |
| `@floria/seller-web` | Next.js 16 (Turbopack)   |   **PASS**   |
| `@floria/admin-web`  | Next.js 16 (Turbopack)   |   **PASS**   |
| `@floria/web`        | Next.js 16 (Turbopack)   |   **PASS**   |

- **Classification**: **PASS**

---

## 18. Environment Variables

- **Separation of Concerns**:
  - Client-facing configuration strictly uses `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`.
  - Server credentials (`SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_CLIENT_SECRET`, `CASHFREE_WEBHOOK_SECRET`, `DATABASE_URL`) are isolated to `backend/api/.env` and Render/Vercel backend settings.
- **Classification**: **PASS**

---

## 19. Secret Scan

- Performed exhaustive search across tracked git files for leaked JWTs, API keys, database connection strings, and payment secrets.
- **Result**: 0 secrets committed.
- **Classification**: **PASS**

---

## 20. Razorpay Removal

- Searched active source tree for `razorpay` / `Razorpay` / `RAZORPAY`.
- **Result**: 0 active Razorpay references or SDKs remain in application code (only historical documentation references). Cashfree is the sole active payment provider.
- **Classification**: **PASS**

---

## 21. Dependency Audit

- Verified `pnpm-workspace.yaml`, `package.json`, and `pnpm-lock.yaml`.
- All workspaces resolve dependencies cleanly without dangling local links.
- **Classification**: **PASS**

---

## 22. Unused Code Cleanup

- Cleaned up obsolete monolithic sub-routes and legacy components from `apps/web` following the split into `apps/seller-web` and `apps/admin-web`.
- No broken imports or orphaned code paths.
- **Classification**: **PASS**

---

## 23. Git Repository Audit

- Inspected repository status with `git status`.
- Verified no untracked secrets, build artifacts, or operating system metadata.
- **Classification**: **PASS**

---

## 24. Gitignore Configuration

- Updated root `.gitignore` to prevent committing `.env`, `.env.*`, `node_modules`, `.next`, `dist`, `build`, `.expo`, `coverage`, `logs`, and IDE files across all workspace packages while preserving `!.env.example`.
- **Classification**: **PASS**

---

## 25. Environment Examples

- Updated root `.env.example` and application-specific `.env.example` templates with sanitized placeholders and documentation for each variable.
- **Classification**: **PASS**

---

## 26. README Documentation

- Updated root `README.md` to document the multi-application monorepo structure, current deployment URLs (`floriaa-web.vercel.app` & `floria-api.onrender.com`), local development quickstart, and testing commands.
- **Classification**: **PASS**

---

## 27. Deployment Documentation

- Synchronized `STEP_15_REPORT.md`, `STEP_15_RELEASE_GATE.md`, `PRODUCTION_CONFIGURATION.md`, and `DEPLOYMENT_RUNBOOK.md` to distinguish hosted production vs local unreleased surfaces.
- **Classification**: **PASS**

---

## 28. Expo Version Reconciliation

- **Audited Installed Versions**:
  - `expo`: `~57.0.17` (Expo SDK 57)
  - `react-native`: `0.86.3`
  - `react`: `19.2.3`
  - `expo-router`: `~57.0.17`
  - `@expo/vector-icons`: `^15.1.1`
- Corrected previous documentation that referenced outdated SDK versions (e.g. SDK 53).
- **Classification**: **PASS**

---

## 29. GitHub Readiness

- Tracked files verified free of conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
- Repository formatted, clean, and ready for remote push.
- Note: Remote push withheld pending explicit user authorization.
- **Classification**: **READY FOR GITHUB PUSH**

---

## 30. Remaining Risks

1. **Cold Starts on Render Free/Starter Tier**: Initial API request latency can reach 15-30s if the service sleeps; production instances should use persistent instances with health check pings.
2. **Payment Live Gateway Smoke Test**: A real ₹1 test transaction will be required prior to public launch.

---

## 31. Deployment Limitations

- Seller Web and Admin Web currently run locally and will need dedicated Vercel or custom domain hosting configured in future deployment milestones.
- Mobile builds are configured for development; release EAS binary signing is scheduled for mobile store submission.

---

## 32. Final Release Gate Evaluation

```text
STEP 15 FINAL GATE: PRODUCTION VERIFIED WITH CONDITIONS
```

**Conditions Met**:

1. Hosted Customer Web on Vercel (`floriaa-web.vercel.app`) is live and responding.
2. Hosted Express API on Render (`floria-api.onrender.com`) is live and connected to Supabase PostgreSQL.
3. Customer Web correctly communicates with the Render API.
4. All 317 automated tests pass with 0 failures.
5. All 11 workspace packages compile cleanly with 0 TypeScript errors.
6. All production builds compile cleanly.
7. Zero secrets committed and repository is clean for GitHub.
