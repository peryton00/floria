# Floria — Staging & Production Deployment Guide

This document defines the architecture, environment configuration, database migrations, security rules, and deployment procedures for the Floria Platform (Web application, REST API backend, and Supabase database).

---

## 1. System Architecture

```
[ Next.js Web Application ] (Vercel / Staging Domain)
         │
         ▼ (HTTPS / CORS Restricted)
[ Floria Express REST API ] (Render Service / PORT 4000)
         │
         ▼ (Service-Role / RLS)
[ Supabase PostgreSQL + Auth ] (Supabase Staging Project)
```

---

## 2. GitHub Repository Configuration

- **Repository**: `https://github.com/peryton00/floria.git`
- **Main Deployment Branch**: `main`
- **Future Feature Branch**: `develop`

---

## 3. Environment Variables Matrix

### A. Next.js Web Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

NEXT_PUBLIC_API_URL=https://<your-floria-api-domain>/api/v1
NEXT_PUBLIC_APP_URL=https://<your-web-staging-domain>
NODE_ENV=production
```

### B. Backend REST API (`backend/api/.env`)
```env
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://<your-supabase-project>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
CORS_ORIGIN=https://<your-web-staging-domain>
RATE_LIMIT_MAX=100
```

---

## 4. Supabase Database & Migrations

All migrations must be executed sequentially in the Supabase SQL Editor:

1. `0001_initial_schema.sql` — Base tables, enums, indexes, and initial RLS policies.
2. `0002_wishlists.sql` — Customer wishlist schema.
3. `0003_multi_nursery_cart.sql` — Cart and multi-nursery line item structures.
4. `0004_seed_data.sql` — Nursery seller profiles and product catalog seed.
5. `0005_seed_permissions.sql` — RBAC roles and permissions system.
6. `0006_seller_order_fulfillments.sql` — Multi-seller sub-order fulfillment tracking.
7. `0007_audit_logs.sql` — Security and administrative audit trail log table.
8. `0008_db_constraints.sql` — Foreign keys and data integrity rules.
9. `0009_rbac_enforcement.sql` — RLS policies enforcing strict role access.
10. `0010_delivery_assignments.sql` — Operations delivery agent assignment schema.
11. `0011_platform_settings.sql` — Platform settings & commission rate management.
12. `0012_auto_user_profile_trigger.sql` — Auto-creation trigger linking `auth.users` to `user_profiles`.

---

## 5. Google OAuth Configuration

In **Google Cloud Console → OAuth Consent Screen & Credentials**:
- **App Name**: `Floria`
- **Authorized Redirect URIs**:
  - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
  - `https://<your-web-staging-domain>/auth/callback`

In **Supabase Dashboard → Authentication → Providers → Google**:
- Enable Google Provider.
- Client ID: `<GOOGLE_CLIENT_ID>`
- Client Secret: `<GOOGLE_CLIENT_SECRET>`

---

## 6. Deployment Commands & Service Setup

### Web Frontend (Vercel)
- Framework Preset: Next.js
- Root Directory: `apps/web`
- Build Command: `pnpm run build`
- Output Directory: `.next`

### Backend REST API (Render)
- Environment: Node.js
- Root Directory: `backend/api`
- Build Command: `pnpm run build`
- Start Command: `pnpm run start`
- Health Check Path: `/health`

---

## 7. Health & Verification Endpoints

- `GET /health` — Returns JSON `{ status: "healthy", service: "floria-api" }`.
- `GET /ready` — Verifies database connection readiness.

---

## 8. Rollback Procedure

1. **Web Frontend**: In Vercel / hosting dashboard, promote previous successful deployment build.
2. **Backend API**: In Render dashboard, trigger manual rollback to previous commit hash.
3. **Database**: Apply downward migrations or restore Supabase Point-in-Time (PITR) backup if schema changes require rollback.
