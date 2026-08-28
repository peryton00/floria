# Floria — Multi-Vendor Plant Marketplace

Production-grade, mobile-first multi-vendor marketplace for plants and gardening products.

## Technology Stack

- **Customer Web**: Next.js 16 + React 19 + TypeScript + Tailwind CSS (Hosted on Vercel)
- **Seller & Admin Web**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Mobile Applications**: React Native 0.86.3 + Expo SDK 57 + TypeScript + Expo Router
- **Backend API**: Node.js + Express (`@floria/api`) (Hosted on Render)
- **Database & Auth**: PostgreSQL via Supabase + Supabase Auth + Supabase Storage
- **Payments**: Cashfree Payment Gateway (Integration active & webhook verified)
- **Unified SDK**: `@floria/api-client` (Universal typed API client for web & mobile)

## Current Deployment Status

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
• Seller Web      (@floria/seller-web)      — Next.js 16 App
• Admin Web       (@floria/admin-web)       — Next.js 16 App
• Customer Mobile (@floria/customer-mobile) — Expo SDK 57 App
• Seller Mobile   (@floria/seller-mobile)   — Expo SDK 57 App
• Admin Mobile    (@floria/admin-mobile)    — Expo SDK 57 App
• Delivery Mobile (@floria/delivery-mobile) — Expo SDK 57 App
```

## Monorepo Structure

```text
floria/
├── apps/
│   ├── web/               # @floria/web             — Customer Web (Vercel production)
│   ├── seller-web/        # @floria/seller-web      — Dedicated Seller Portal
│   ├── admin-web/         # @floria/admin-web       — Dedicated Admin Control Center
│   ├── customer-mobile/   # @floria/customer-mobile — Customer iOS & Android App
│   ├── seller-mobile/     # @floria/seller-mobile   — Seller Partner Cockpit App
│   ├── admin-mobile/      # @floria/admin-mobile    — Admin Operational Triage App
│   └── delivery-mobile/   # @floria/delivery-mobile — Delivery Partner POD App
├── packages/
│   ├── api-client/        # @floria/api-client      — Universal typed API client
│   ├── types/             # @floria/types           — Shared TypeScript domain types
│   └── validation/        # @floria/validation      — Shared Zod validation schemas
├── backend/
│   └── api/               # @floria/api             — Express REST API (Render production)
├── supabase/
│   ├── migrations/        # PostgreSQL migrations (0001-0028)
│   └── seed/              # Development seed data
└── docs/                  # Architectural and operational documentation
```

## Quick Start (Local Development)

```bash
# 1. Setup environment templates
cp .env.example .env.local
cp backend/api/.env.example backend/api/.env

# 2. Install dependencies
pnpm install

# 3. Start development servers
pnpm dev:backend               # Express API: http://localhost:4000
pnpm dev                       # Customer Web: http://localhost:3000
pnpm dev:seller-web            # Seller Web: http://localhost:3001
pnpm dev:admin-web             # Admin Web: http://localhost:3002
```

## Key Scripts

| Script                     | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `pnpm dev`                 | Start Customer Web (`apps/web`)                          |
| `pnpm dev:backend`         | Start Express API (`backend/api`)                        |
| `pnpm dev:seller-web`      | Start Seller Web (`apps/seller-web`)                     |
| `pnpm dev:admin-web`       | Start Admin Web (`apps/admin-web`)                       |
| `pnpm dev:customer-mobile` | Start Expo for Customer Mobile                           |
| `pnpm dev:seller-mobile`   | Start Expo for Seller Mobile                             |
| `pnpm dev:admin-mobile`    | Start Expo for Admin Mobile                              |
| `pnpm dev:delivery-mobile` | Start Expo for Delivery Mobile                           |
| `pnpm test`                | Run complete automated test suite (317 tests passing)    |
| `pnpm typecheck`           | Run complete TypeScript validation across all workspaces |
| `pnpm build`               | Build production artifacts (`api-client`, `web`, `api`)  |

## Core Invariants

- **Never Trust Client Inputs**: Prices, inventory counts, seller authorizations, and payment statuses are validated server-side on `@floria/api`.
- **Single Canonical Backend**: All client surfaces communicate strictly with `@floria/api`. No direct database access from client applications.
- **Idempotent Webhooks**: Payment gateways and asynchronous webhook events enforce cryptographic HMAC signature checks and deduplication.
- **Zero Committed Secrets**: All secrets reside in deployment provider vaults (Render / Vercel environment variables).
