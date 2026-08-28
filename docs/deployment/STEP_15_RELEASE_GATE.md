# Floria — Step 15 Release Gate Evaluation (Current Deployment Baseline)

**Decision Target:** Real Production Smoke Testing & Release Verification
**Evaluation Standard:** Multi-Environment Evidence-Based Verification
**Date:** August 2026

---

## Current Production Deployment Architecture

```text
                  FLORIA PLATFORM

          CURRENTLY HOSTED PRODUCTION
          ────────────────────────────
Customer Web ──► Vercel (https://floriaa-web.vercel.app)
                      │
                      ▼
Backend API  ──► Render (https://floria-api.onrender.com)
                      │
             ┌────────┼────────┐
             ▼        ▼        ▼
          Supabase Cashfree  Storage

          LOCAL / PENDING DEPLOYMENT
          ──────────────────────────
• Seller Web      (@floria/seller-web)      — LOCAL RUNTIME VERIFIED (Not Yet Deployed)
• Admin Web       (@floria/admin-web)       — LOCAL RUNTIME VERIFIED (Not Yet Deployed)
• Customer Mobile (@floria/customer-mobile) — LOCAL RUNTIME VERIFIED (Expo SDK 57)
• Seller Mobile   (@floria/seller-mobile)   — LOCAL RUNTIME VERIFIED (Expo SDK 57)
• Admin Mobile    (@floria/admin-mobile)    — LOCAL RUNTIME VERIFIED (Expo SDK 57)
• Delivery Mobile (@floria/delivery-mobile) — LOCAL RUNTIME VERIFIED (Expo SDK 57)
```

---

## Release Gate Matrix

| Category                     | Verification Criterion                         |             Status             | Evidence / Validation Method                                                          |
| :--------------------------- | :--------------------------------------------- | :----------------------------: | :------------------------------------------------------------------------------------ |
| **Hosted Backend Liveness**  | `GET https://floria-api.onrender.com/health`   | **HOSTED PRODUCTION VERIFIED** | `HTTP 200 OK` — `{"status":"healthy","service":"floria-api"}` (Render)                |
| **Hosted Backend Readiness** | `GET https://floria-api.onrender.com/ready`    | **HOSTED PRODUCTION VERIFIED** | `HTTP 200 OK` — `{"status":"ready","database":"connected"}` (Supabase DB)             |
| **Hosted Customer Web**      | `GET https://floriaa-web.vercel.app`           | **HOSTED PRODUCTION VERIFIED** | `HTTP 200 OK` (Vercel Edge, SSL active, rendered HTML)                                |
| **Customer Web → API Link**  | Client bundle network requests                 | **HOSTED PRODUCTION VERIFIED** | Verified client scripts point to `https://floria-api.onrender.com` (0 localhost refs) |
| **Catalog API Live Query**   | `GET /api/v1/catalog/products` & `/categories` | **HOSTED PRODUCTION VERIFIED** | `HTTP 200 OK` — Live product & category catalog data returned                         |
| **Seller Web App**           | Nursery Portal & Inventory Stock               |   **LOCAL RUNTIME VERIFIED**   | 15 unit tests passing; local Next.js build PASS (Not yet independently deployed)      |
| **Admin Web App**            | Moderation & System Operations                 |   **LOCAL RUNTIME VERIFIED**   | 8 unit tests passing; local Next.js build PASS (Not yet independently deployed)       |
| **Customer Mobile App**      | Catalog, Cart & Vector Icons                   |   **LOCAL RUNTIME VERIFIED**   | 12 unit tests passing; Expo SDK 57 / React Native 0.86.3 active                       |
| **Seller Mobile App**        | Radar Cockpit & Inventory Control              |   **LOCAL RUNTIME VERIFIED**   | 10 unit tests passing; Expo SDK 57 / React Native 0.86.3 active                       |
| **Admin Mobile App**         | Triage Radar & Audit Logs                      |   **LOCAL RUNTIME VERIFIED**   | 9 unit tests passing; Expo SDK 57 / React Native 0.86.3 active                        |
| **Delivery Mobile App**      | POD & Dispatch Workflows                       |   **LOCAL RUNTIME VERIFIED**   | 7 unit tests passing; Expo SDK 57 / React Native 0.86.3 active                        |
| **Cashfree Live Charge**     | Live money transaction                         |        **NOT VERIFIED**        | Intentionally skipped for financial safety without explicit auth                      |
| **Cashfree Webhooks**        | HMAC-SHA256 signature verification             |  **AUTOMATED TEST VERIFIED**   | Cryptographic verification & DB idempotency tested in `@floria/api`                   |
| **Total Test Suite**         | Full workspace test execution                  |  **AUTOMATED TEST VERIFIED**   | 317/317 tests passing across all packages (0 failures)                                |
| **TypeScript Validation**    | `tsc --noEmit` across all 11 packages          |  **AUTOMATED TEST VERIFIED**   | 0 TypeScript compilation errors                                                       |
| **Production Compilations**  | Production builds for web & backend            |  **AUTOMATED TEST VERIFIED**   | `web`, `seller-web`, `admin-web`, `api`, `api-client` all PASS                        |
| **Secret Scanning**          | Repository credential audit                    |            **PASS**            | 0 leaked credentials; clean `.gitignore` & safe `.env.example` templates              |
| **Razorpay Elimination**     | Complete code excision                         |            **PASS**            | 0 active Razorpay references in code                                                  |

---

## Final Gate Decision

```text
STEP 15 FINAL GATE: PRODUCTION VERIFIED WITH CONDITIONS
```

### Operational Conditions & Transition Notes:

1. **Transition Platform State**: Customer Web (`floriaa-web.vercel.app`) and Backend API (`floria-api.onrender.com`) are fully operational and verified live in production.
2. **Pending Deployments**: Seller Web, Admin Web, and the 4 Expo mobile apps are validated locally and ready for independent staging/production deployment in subsequent roadmap steps.
3. **No Phantom Domain Blockers**: Custom domains (`floria.in`, `api.floria.in`, etc.) are not treated as deployment blockers during this intermediate phase.
