# Floria — Step 18 Seller Web & Admin Web Production Deployment Architecture

---

## 1. Executive Summary & Web Surface Topology

Floria provides three independent Next.js web application surfaces within the unified monorepo:

```text
                               GITHUB (origin/main)
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   Customer Web Project       Seller Web Project         Admin Web Project
      (apps/web)               (apps/seller-web)          (apps/admin-web)
            │                          │                          │
            ▼                          ▼                          ▼
   Vercel Deployment          Vercel Deployment          Vercel Deployment
 (floriaa-web.vercel.app)    (Pending Project Link)     (Pending Project Link)
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                       https://floria-api.onrender.com
                                       │
                             ┌─────────┼─────────┐
                             ▼         ▼         ▼
                          Supabase  Cashfree  Storage
```

---

## 2. Vercel Project Configurations

### A. Customer Web (`apps/web`) — Hosted Production
- **Project Name**: `floria-web` (or `floriaa-web`)
- **Root Directory**: `apps/web`
- **Framework Preset**: `Next.js`
- **Build Command**: `pnpm build` (or Next.js automatic)
- **Install Command**: `pnpm install --frozen-lockfile`
- **Production URL**: `https://floriaa-web.vercel.app`
- **Status**: **RUNTIME VERIFIED (LIVE)**

### B. Seller Web (`apps/seller-web`) — Ready for Deployment
- **Project Name**: `floria-seller-web`
- **Root Directory**: `apps/seller-web`
- **Framework Preset**: `Next.js`
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Include Files Outside Root Directory**: Enabled (monorepo dependency access)
- **Node Version**: `20.x`
- **Status**: **CONFIGURED (READY FOR VERCEL LINKING)**

### C. Admin Web (`apps/admin-web`) — Ready for Deployment
- **Project Name**: `floria-admin-web`
- **Root Directory**: `apps/admin-web`
- **Framework Preset**: `Next.js`
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Include Files Outside Root Directory**: Enabled (monorepo dependency access)
- **Node Version**: `20.x`
- **Status**: **CONFIGURED (READY FOR VERCEL LINKING)**

---

## 3. Environment Variable Matrix

| Variable | Application | Classification | Scope | Production Value / Source |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Seller Web, Admin Web, Customer Web | Public | Client Bundle | `https://floria-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Seller Web, Admin Web, Customer Web | Public | Client Bundle | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Seller Web, Admin Web, Customer Web | Public | Client Bundle | Supabase Anon Public Key |
| `NEXT_PUBLIC_APP_URL` | Seller Web (`:3001`), Admin Web (`:3002`) | Public | Client Bundle | `https://<assigned-vercel-domain>.vercel.app` |
| `NODE_ENV` | All Web Apps | Public | Build-time | `production` |

> [!CAUTION]
> **Strict Server-Only Invariant**: Neither Seller Web nor Admin Web shall receive `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CASHFREE_CLIENT_SECRET`, or `CASHFREE_WEBHOOK_SECRET`. All privileged actions and payments are executed strictly server-side by `@floria/api` on Render.

---

## 4. Authentication, Session & RBAC Integration

Both `apps/seller-web` and `apps/admin-web` consume the universal typed `@floria/api-client` (`src/lib/api.ts`):
1. **Token Ingestion**: Access tokens are retrieved from Supabase browser auth sessions and dynamically injected into request headers: `Authorization: Bearer <access_token>`.
2. **Server-Side Enforcement**: The Express backend (`backend/api`) decrypts/verifies JWTs and validates user roles (`seller`, `admin`, `super_admin`).
3. **Graceful Error Handling**: 401 Unauthorized / 403 Forbidden responses automatically redirect to `/login` or display appropriate unauthorized feedback without leaking stack traces or internal endpoints.

---

## 5. Backend CORS Configuration

The Render backend (`backend/api/src/middleware/cors.ts`) enforces origin validation:
- Dynamically permits all `*.vercel.app` deployment domains (including Preview and Production URLs).
- Explicit origins configured via `CORS_ALLOWED_ORIGINS` environment variable in Render dashboard.
- Rejects unlisted cross-origin requests with HTTP 403.

---

## 6. Manual Vercel Project Setup Steps

To deploy Seller Web and Admin Web to Vercel:

1. **Open Vercel Dashboard** $\rightarrow$ Click **"Add New... Project"**.
2. **Import Git Repository**: Select `peryton00/floria`.
3. **Configure Seller Web**:
   - Project Name: `floria-seller-web`
   - Root Directory: `apps/seller-web`
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL`: `https://floria-api.onrender.com`
     - `NEXT_PUBLIC_SUPABASE_URL`: `<your-supabase-url>`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - Click **Deploy**.
4. **Configure Admin Web**:
   - Project Name: `floria-admin-web`
   - Root Directory: `apps/admin-web`
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL`: `https://floria-api.onrender.com`
     - `NEXT_PUBLIC_SUPABASE_URL`: `<your-supabase-url>`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - Click **Deploy**.
