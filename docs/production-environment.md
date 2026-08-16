# Floria — Production Environment Variables Matrix

This document lists all environment variable keys required for Floria production and staging deployments across the Web Frontend, Backend API, Supabase, and External Integrations.

> [!CAUTION]
> **NEVER** commit actual secret values, service role keys, or database passwords to Git repositories.

---

## 1. Web Application (`apps/web`)

| Variable Name | Description | Status | Server/Client |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Canonical Supabase project URL | **Required** | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous client key | **Required** | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only administrative bypass key | **Required** (Server Only) | Server Only |
| `NEXT_PUBLIC_API_URL` | Production REST API base endpoint (`/api/v1`) | **Required** | Client & Server |
| `NEXT_PUBLIC_APP_URL` | Production Web application domain | **Required** | Client & Server |
| `NODE_ENV` | Environment identifier (`production`) | **Required** | Server Only |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay key for checkout modal | **Optional / Deferred** | Client & Server |
| `RAZORPAY_KEY_SECRET` | Server-only Razorpay secret key | **Optional / Deferred** | Server Only |
| `RAZORPAY_WEBHOOK_SECRET` | Server-only Razorpay webhook signature secret | **Optional / Deferred** | Server Only |

---

## 2. Backend REST API (`backend/api`)

| Variable Name | Description | Status | Environment |
|---|---|---|---|
| `PORT` | Dynamic HTTP port assigned by host | **Required** | Server |
| `NODE_ENV` | Runtime environment (`production`) | **Required** | Server |
| `SUPABASE_URL` | Supabase PostgreSQL project URL | **Required** | Server |
| `SUPABASE_ANON_KEY` | Public Supabase anon key | **Required** | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Backend DB Access) | **Required** | Server Only |
| `DATABASE_URL` | Direct PostgreSQL connection string | **Optional** (Direct Access) | Server Only |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed web domains | **Required** | Server |
| `RATE_LIMIT_MAX` | Max requests per minute per IP | **Optional** (Default: 120) | Server |
| `JWT_SECRET` | Supabase Auth JWT Secret | **Required** | Server Only |

---

## 3. Supabase & Auth Infrastructure

| Setting / Variable | Location / Purpose | Status |
|---|---|---|
| **Google OAuth Client ID** | Supabase Auth → Providers → Google | **Required** |
| **Google OAuth Client Secret** | Supabase Auth → Providers → Google | **Required** |
| **Site URL & Redirect URIs** | Supabase Auth → URL Configuration | **Required** (`https://floria.in/auth/callback`) |
| **Storage Bucket Policies** | Supabase Dashboard → Storage | **Required** (`product-images` public, `seller-documents` private) |

---

## 4. Operational & External Services Status

- **Web Hosting**: Vercel / Netlify Production
- **Backend API Hosting**: Render (Singapore / Mumbai region)
- **Database & Auth**: Supabase Managed Cloud
- **Monitoring**: Render Metrics + Sentry Error Boundary (*Not yet configured*)
- **Push Notifications (FCM)**: Mobile Push integration (*Not yet configured*)
- **Email Service (Resend/SES)**: Transactional Email Gateway (*Not yet configured*)
