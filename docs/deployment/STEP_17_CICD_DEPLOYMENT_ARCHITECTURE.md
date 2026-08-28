# Floria — Production CI/CD & Multi-Application Deployment Architecture

---

## 1. Executive Summary & Deployment Topology

The Floria platform utilizes a unified GitHub-centric deployment model where the monorepo acts as the single source of truth, enforcing automated quality gates before triggering provider deployments:

```text
                         GITHUB (origin/main)
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │    CI QUALITY GATES      │
                     │  - Secret Scanning       │
                     │  - 11-Package Typecheck  │
                     │  - 317 Automated Tests   │
                     │  - 5 Production Builds   │
                     └────────────┬─────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
                VERCEL                         RENDER
                   │                             │
    ┌──────────────┼──────────────┐              └── Backend REST API
    ▼              ▼              ▼                  (@floria/api)
Customer Web   Seller Web     Admin Web                    │
 (apps/web)  (apps/seller-web) (apps/admin-web)  ┌─────────┼─────────┐
    │                                            ▼         ▼         ▼
  LIVE          READY          READY          Supabase  Cashfree  Storage
```

---

## 2. CI/CD Quality Gates (`.github/workflows/ci.yml`)

Every pull request and push to `main` must pass three concurrent gate jobs:

1. **`secret-audit`**:
   - Scans git tracking index for unignored `.env` files.
   - Detects committed JWT patterns (`SUPABASE_SERVICE_ROLE_KEY=ey...`) or live API secrets.
   - Verifies 0 active Razorpay references in application source code.
2. **`typecheck-and-test`**:
   - Enforces `pnpm install --frozen-lockfile` with Node.js 20 and pnpm 9.15.9.
   - Executes `pnpm -r run typecheck` across all 11 packages (0 TypeScript errors required).
   - Executes `pnpm test` (317 tests passing required).
3. **`production-builds`**:
   - Compiles `@floria/api-client` (tsup CJS/ESM/DTS).
   - Compiles `@floria/api` (tsc).
   - Compiles `@floria/seller-web`, `@floria/admin-web`, and `@floria/web` (Next.js Turbopack).

---

## 3. Vercel Multi-Project Architecture

Each Next.js application is deployed as an isolated Vercel project connected to the root GitHub repository:

| Project | Root Directory | Framework Preset | Build Command | Output Directory | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Web** | `apps/web` | Next.js | `pnpm build` | `.next` | **LIVE** (`floriaa-web.vercel.app`) |
| **Seller Web** | `apps/seller-web` | Next.js | `pnpm build` | `.next` | **READY FOR DEPLOYMENT** |
| **Admin Web** | `apps/admin-web` | Next.js | `pnpm build` | `.next` | **READY FOR DEPLOYMENT** |

### Monorepo Vercel Settings
- **Root Directory**: Configured per application (`apps/web`, `apps/seller-web`, `apps/admin-web`).
- **Include Files Outside Root Directory**: Enabled (allows access to `packages/api-client`, `packages/types`, `pnpm-lock.yaml`).
- **Install Command**: `pnpm install --frozen-lockfile` (executed automatically from root).

---

## 4. Render Backend API Architecture

- **Service Type**: Web Service (Node.js)
- **Blueprint File**: [render.yaml](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/render.yaml)
- **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @floria/api-client build && pnpm --filter @floria/api build`
- **Start Command**: `pnpm --filter @floria/api start`
- **Health Check Path**: `/health` (Liveness)
- **Readiness Check**: `/ready` (Database & dependency readiness)
- **Auto Deploy**: Enabled on `main` branch push.

---

## 5. Environment Variable Separation & Security Invariants

```text
┌────────────────────────────────────────────────────────┐
│                   PUBLIC (Client Bundle)               │
│  - NEXT_PUBLIC_API_URL=https://floria-api.onrender.com │
│  - NEXT_PUBLIC_SUPABASE_URL                            │
│  - NEXT_PUBLIC_SUPABASE_ANON_KEY                       │
│  - EXPO_PUBLIC_API_URL                                 │
└────────────────────────────────────────────────────────┘
                           │
                 SECURITY BOUNDARY (HTTP API)
                           │
┌────────────────────────────────────────────────────────┐
│               SERVER-ONLY (Render Vault Only)          │
│  - SUPABASE_SERVICE_ROLE_KEY                           │
│  - DATABASE_URL                                        │
│  - CASHFREE_CLIENT_ID                                  │
│  - CASHFREE_CLIENT_SECRET                              │
│  - CASHFREE_WEBHOOK_SECRET                             │
│  - REDIS_URL                                           │
└────────────────────────────────────────────────────────┘
```

---

## 6. Mobile Application Integration Boundary (Future Step)

The 4 mobile applications (`customer-mobile`, `seller-mobile`, `admin-mobile`, `delivery-mobile`) consume the canonical GitHub repository via Expo Application Services (EAS):

```text
GitHub (main) ──► EAS Build (Cloud) ──► Signed App Binaries (.ipa / .aab) ──► Stores
```

---

## 7. Rollback & Operational Safety

1. **Vercel Rollback**: Instant zero-downtime rollback to any previous deployment alias in the Vercel Dashboard.
2. **Render Rollback**: Rollback to any previous commit/build tag via Render Service History.
3. **Database Independence**: Database schema changes follow the expand-contract pattern. Application rollbacks never trigger destructive SQL down-migrations.
