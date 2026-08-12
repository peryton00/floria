# Architecture

## Stack
Web: Next.js + TypeScript + App Router
UI: React + Tailwind CSS + reusable components
Backend/data: Supabase
Database: PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Realtime: Supabase Realtime where useful
Payments: Razorpay, subject to eligibility/compliance
Hosting: Vercel
Repo: GitHub monorepo
Testing: Vitest + Playwright
Future mobile: Expo + React Native + TypeScript

## Target repository
```text
floria/
├── apps/web/
├── packages/ui/
├── packages/types/
├── packages/validation/
├── packages/api/
├── supabase/migrations/
├── supabase/seed/
├── docs/
└── .agents/
```

One backend/database is the source of truth. Share data contracts, validation and business rules with future mobile; do not force identical UI code across web/mobile.

Core data: users, customer_profiles, seller_profiles, seller_documents, categories, products, product_images, inventory, addresses, carts, cart_items, orders, order_items, payments, order_events/audit records, commission/settlement records and operational delivery records.

No microservices, separate client backends or unnecessary infrastructure for MVP.
