# Floria — Deployment Inventory & Infrastructure Register

**Generated:** August 2026
**Environment Baseline:** Pre-Production & Staging Validation

---

## 1. Application Surfaces

| Application         | Technology             | Location               | Environment    | Target Hosting              | Required Public Variables                                                          | Required Secrets   | Health / Probe     |
| :------------------ | :--------------------- | :--------------------- | :------------- | :-------------------------- | :--------------------------------------------------------------------------------- | :----------------- | :----------------- |
| **Customer Web**    | Next.js 15 App Router  | `apps/web`             | Staging / Prod | Vercel / Node.js Cluster    | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | None (Client only) | `GET /` (HTTP 200) |
| **Seller Web**      | Next.js 15 App Router  | `apps/seller-web`      | Staging / Prod | Vercel / Node.js Cluster    | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | None (Client only) | `GET /` (HTTP 200) |
| **Admin Web**       | Next.js 15 App Router  | `apps/admin-web`       | Staging / Prod | Vercel / Node.js Cluster    | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | None (Client only) | `GET /` (HTTP 200) |
| **Customer Mobile** | React Native / Expo 53 | `apps/customer-mobile` | Staging / Prod | iOS App Store / Google Play | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | None (App binary)  | App Launch         |
| **Seller Mobile**   | React Native / Expo 53 | `apps/seller-mobile`   | Staging / Prod | iOS App Store / Google Play | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | None (App binary)  | App Launch         |
| **Admin Mobile**    | React Native / Expo 53 | `apps/admin-mobile`    | Staging / Prod | Internal TestFlight / APK   | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | None (App binary)  | App Launch         |
| **Delivery Mobile** | React Native / Expo 53 | `apps/delivery-mobile` | Staging / Prod | Internal TestFlight / APK   | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | None (App binary)  | App Launch         |

---

## 2. Backend & Core Infrastructure

| Component               | Technology                    | Location              | Environment    | Target Hosting                   | Required Secrets                                                                                                       | Health Check Endpoint                        |
| :---------------------- | :---------------------------- | :-------------------- | :------------- | :------------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **Express REST API**    | Express.js / TypeScript       | `backend/api`         | Staging / Prod | AWS ECS / DigitalOcean / Render  | `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET`, `CASHFREE_WEBHOOK_SECRET` | `GET /health` & `GET /ready`                 |
| **PostgreSQL Database** | PostgreSQL 15                 | Supabase Managed      | Staging / Prod | Supabase Cloud (AWS ap-south-1)  | `POSTGRES_PASSWORD`, `DATABASE_URL` (PgBouncer pool: 6543)                                                             | `SELECT 1` via `/ready` probe                |
| **Payment Gateway**     | Cashfree PG API (v2023-08-01) | Cloud Integration     | Sandbox / Live | Cashfree Payments India          | `CASHFREE_CLIENT_SECRET`, `CASHFREE_WEBHOOK_SECRET`                                                                    | `POST /api/v1/payments/webhook`              |
| **Media Storage**       | S3-compatible Buckets         | Supabase Storage      | Staging / Prod | Supabase Storage / Cloudflare R2 | Storage Admin Secret Key                                                                                               | `GET /api/v1/media/upload-session`           |
| **Shared SDK**          | TypeScript Package            | `packages/api-client` | Workspace      | Monorepo internal                | None                                                                                                                   | `pnpm --filter @floria/api-client typecheck` |
