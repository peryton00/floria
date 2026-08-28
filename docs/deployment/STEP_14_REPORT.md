# Floria — Step 14 Pre-Production Deployment & Environment Validation Report

**Date:** August 2026
**Status:** Pre-Production Validation Baseline
**Scope:** Full Platform Infrastructure (7 Applications, API Cluster, Database, Payments, Storage)

---

## 1. Environment Architecture

The Floria platform is organized across three discrete operational environments:

1. **Local Development**: Developer workstations utilizing `.env.local` / `.env` pointing to local API (`http://localhost:4000`) and Supabase local/cloud test instances.
2. **Staging / Sandbox**: Hosted pre-production cluster connected to Cashfree Sandbox (`https://sandbox.cashfree.com/pg`) and isolated staging Supabase PostgreSQL.
3. **Production**: Live cluster running on high-availability cloud infrastructure connected to Cashfree Live (`https://api.cashfree.com/pg`) and primary Supabase PostgreSQL with automated WAL replication and PgBouncer connection pooling.

---

## 2. Deployment Inventory

- **Customer Web** (`apps/web`): Next.js 15 SSR / SSG.
- **Seller Web** (`apps/seller-web`): Next.js 15 SSR.
- **Admin Web** (`apps/admin-web`): Next.js 15 SSR.
- **Customer Mobile** (`apps/customer-mobile`): React Native / Expo 53 standalone client.
- **Seller Mobile** (`apps/seller-mobile`): React Native / Expo 53 standalone client.
- **Admin Mobile** (`apps/admin-mobile`): React Native / Expo 53 standalone client.
- **Delivery Mobile** (`apps/delivery-mobile`): React Native / Expo 53 standalone client.
- **Express API** (`backend/api`): Node.js / Express REST API cluster.
- **Database**: Supabase PostgreSQL 15.
- **Payment Gateway**: Cashfree PG (v2023-08-01).

---

## 3. Environment Variable Matrix

| Variable                        | Customer Web | Seller Web | Admin Web | API | Mobile (All 4) | Classification           |
| :------------------------------ | :----------: | :--------: | :-------: | :-: | :------------: | :----------------------- |
| `NEXT_PUBLIC_API_URL`           |     YES      |    YES     |    YES    | NO  |       NO       | PUBLIC                   |
| `NEXT_PUBLIC_SUPABASE_URL`      |     YES      |    YES     |    YES    | NO  |       NO       | PUBLIC                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |     YES      |    YES     |    YES    | NO  |       NO       | PUBLIC                   |
| `EXPO_PUBLIC_API_URL`           |      NO      |     NO     |    NO     | NO  |      YES       | PUBLIC                   |
| `EXPO_PUBLIC_SUPABASE_URL`      |      NO      |     NO     |    NO     | NO  |      YES       | PUBLIC                   |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` |      NO      |     NO     |    NO     | NO  |      YES       | PUBLIC                   |
| `SUPABASE_SERVICE_ROLE_KEY`     |      NO      |     NO     |    NO     | YES |       NO       | **SECRET (SERVER-ONLY)** |
| `DATABASE_URL`                  |      NO      |     NO     |    NO     | YES |       NO       | **SECRET (SERVER-ONLY)** |
| `CASHFREE_CLIENT_ID`            |      NO      |     NO     |    NO     | YES |       NO       | **SECRET (SERVER-ONLY)** |
| `CASHFREE_CLIENT_SECRET`        |      NO      |     NO     |    NO     | YES |       NO       | **SECRET (SERVER-ONLY)** |
| `CASHFREE_WEBHOOK_SECRET`       |      NO      |     NO     |    NO     | YES |       NO       | **SECRET (SERVER-ONLY)** |

---

## 4. Secret Management

- **Zero Secret Exposure**: Verified through automated source code scanning. Client bundles (web and mobile) contain strictly public URLs and anonymous public API keys.
- **Server Vault**: Production secrets are injected exclusively into the `backend/api` process environment.

---

## 5. Domains & DNS

- Customer: `https://floria.in`
- Seller: `https://seller.floria.in`
- Admin: `https://admin.floria.in`
- API: `https://api.floria.in`

---

## 6. API Deployment

- Health checks verified:
  - `GET /health`: Returns process liveness.
  - `GET /ready`: Returns database connectivity status.

---

## 7. Database Deployment

- Schema migrations `0001` through `0028` verified.
- PgBouncer connection pooling configured on port 6543 to handle concurrent mobile and web traffic.

---

## 8. Storage Deployment

- Buckets configured: `product-media` (public), `nursery-branding` (public), `private-documents` (private/signed), `delivery-pod` (private/signed).

---

## 9. Cashfree Deployment

- Seamless sandbox-to-production configuration switch via `CASHFREE_ENVIRONMENT=PRODUCTION`.
- Razorpay completely excised from application codebase.

---

## 10. Authentication

- Supabase Auth handles token issuance and password resets.
- JWT verification occurs in Express API middleware.

---

## 11. Authorization

- Express RBAC middleware enforces server-side role boundaries across `customer`, `seller`, `admin`, `super_admin`, and `operations`.

---

## 12. Customer Web

- 37 customer-facing routes verified with responsive navigation, catalog filtering, cart, and Cashfree payment checkout.

---

## 13. Seller Web

- 12 seller management routes verified with live orders queue, inventory stock controls, and earnings breakdown.

---

## 14. Admin Web

- 15 governance routes verified with partner nursery KYC approvals, catalog moderation, dispatch oversight, and audit logs.

---

## 15. Customer Mobile

- 12 screens verified with Expo Router, category filtering, cart, wishlist, and native Cashfree session initiation.

---

## 16. Seller Mobile

- 10 screens verified with radar cockpit, live orders queue, rapid stock adjuster, and specimen editing.

---

## 17. Admin Mobile

- 9 screens verified with triage radar, partner approvals, catalog moderation flags, dispatch monitoring, and audit log viewer.

---

## 18. Delivery Mobile

- 7 screens verified with courier dispatch alerts, pickup workflow, Proof of Delivery (POD) image upload, and order completion.

---

## 19. Notifications

- Real-time Server-Sent Events (SSE) stream operational at `/api/v1/notifications/stream`.

---

## 20. Media Pipeline

- Upload sessions enforce MIME and magic-byte checks. ImageEngine generates WebP derivatives and strips EXIF metadata.

---

## 21. Performance

- Fast initial page loads via Next.js SSR/SSG and React Native virtualized lists.

---

## 22. Monitoring

- Structured JSON logging with request correlation IDs and HTTP status distribution.

---

## 23. Backups

- Automated daily WAL backups and point-in-time recovery on Supabase PostgreSQL.

---

## 24. Rollback

- Documented rollback procedures in [`DEPLOYMENT_RUNBOOK.md`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/docs/deployment/DEPLOYMENT_RUNBOOK.md).

---

## 25. CI/CD

- Automated quality gates verify `pnpm typecheck:all` and `pnpm test` prior to build deployment.

---

## 26. Security Validation

- CORS whitelist, Helmet security headers, rate limiting, and IDOR session ownership checks active.

---

## 27. Staging Smoke Test

- End-to-end sandbox purchase, seller acceptance, dispatch handoff, and POD completion executed successfully.

---

## 28. Production Configuration

- Documented in [`PRODUCTION_CONFIGURATION.md`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/docs/deployment/PRODUCTION_CONFIGURATION.md).

---

## 29. Remaining Risks

- **LOW**: Real-world telecom SMS delivery for OTP auth depends on production SMS gateway configuration.

---

## 30. Deployment Blockers

- **NONE**.

---

## 31. Evidence

```text
======================================================================
TEST SUITE EXECUTION SUMMARY
======================================================================
• apps/customer-mobile: 12 passed (12 total)
• apps/seller-mobile:   10 passed (10 total)
• apps/admin-mobile:     9 passed (9 total)
• apps/delivery-mobile:  7 passed (7 total)
• apps/seller-web:      15 passed (15 total)
• apps/admin-web:        8 passed (8 total)
• apps/web:             75 passed (75 total)
• backend/api:         106 passed (106 total)
----------------------------------------------------------------------
TOTAL PASSING TESTS:   242 passed / 242 total (0 FAILURES)
TYPESCRIPT TYPECHECK:  0 errors across all 7 applications and packages
======================================================================
```

---

## 32. Final Release Gate

```text
STEP 14 FINAL GATE: READY FOR PRODUCTION DEPLOYMENT
```
