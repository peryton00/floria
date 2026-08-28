# Architecture

## Core principle: Separate the applications, not the platform

Floria is **one platform with multiple clients**. There is one authoritative API, one domain model, one database. Client applications are separated by role; business rules are not.

```
Customer Web ───────┐
Customer Mobile ────┤
Seller Web ─────────┤
Seller Mobile ──────┤  →  @floria/api  →  Domain / Services  →  Supabase PostgreSQL
Admin Web ──────────┤
Admin Mobile ───────┤
Delivery Mobile ────┘
```

## Stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Web apps         | Next.js 16 + React + TypeScript + Tailwind            |
| Mobile apps      | React Native + Expo SDK 53 + TypeScript + Expo Router |
| Backend          | Node.js + Express + TypeScript (`@floria/api`)        |
| Database         | PostgreSQL via Supabase                               |
| Auth             | Supabase Auth (JWT, `Authorization: Bearer`)          |
| Storage          | Supabase Storage                                      |
| Payments         | Cashfree Payment Gateway                              |
| Background jobs  | Redis + BullMQ                                        |
| Image processing | Sharp                                                 |
| Monorepo         | pnpm workspaces                                       |
| CI/CD            | GitHub Actions (web → Vercel, API → Render)           |

## Applications

| App                                 | Package                   | Location                | Status    |
| ----------------------------------- | ------------------------- | ----------------------- | --------- |
| Customer + Seller + Admin Web (MVP) | `@floria/web`             | `apps/web/`             | ✅ Active |
| Seller Web (dedicated)              | `@floria/seller-web`      | `apps/seller-web/`      | 🏗 Shell   |
| Admin Web (dedicated)               | `@floria/admin-web`       | `apps/admin-web/`       | 🏗 Shell   |
| Customer Mobile                     | `@floria/customer-mobile` | `apps/customer-mobile/` | 🏗 Shell   |
| Seller Mobile                       | `@floria/seller-mobile`   | `apps/seller-mobile/`   | 🏗 Shell   |
| Admin Mobile                        | `@floria/admin-mobile`    | `apps/admin-mobile/`    | 🏗 Shell   |
| Delivery Mobile                     | `@floria/delivery-mobile` | `apps/delivery-mobile/` | 🏗 Shell   |
| Backend API                         | `@floria/api`             | `backend/api/`          | ✅ Active |

> `@floria/web` hosts Customer, Seller, and Admin surfaces in one Next.js deployment for MVP. Dedicated web portals (`seller-web`, `admin-web`) are established as shells for incremental extraction.

## Shared packages

| Package              | Location               | Purpose                                   |
| -------------------- | ---------------------- | ----------------------------------------- |
| `@floria/api-client` | `packages/api-client/` | Universal typed API client (Web + Mobile) |
| `@floria/types`      | `packages/types/`      | Shared TypeScript domain types            |
| `@floria/validation` | `packages/validation/` | Shared Zod schemas                        |

## Repository structure

```
floria/
├── apps/
│   ├── web/               # @floria/web — Customer+Seller+Admin Web (MVP)
│   ├── seller-web/        # @floria/seller-web — Seller Portal (shell)
│   ├── admin-web/         # @floria/admin-web — Admin Control Center (shell)
│   ├── customer-mobile/   # @floria/customer-mobile — Customer iOS+Android (shell)
│   ├── seller-mobile/     # @floria/seller-mobile — Seller iOS+Android (shell)
│   ├── admin-mobile/      # @floria/admin-mobile — Admin iOS+Android (shell)
│   └── delivery-mobile/   # @floria/delivery-mobile — Delivery Partner iOS+Android (shell)
├── packages/
│   ├── api-client/        # @floria/api-client — shared API client
│   ├── types/             # @floria/types — shared domain types
│   └── validation/        # @floria/validation — shared Zod schemas
├── backend/
│   └── api/               # @floria/api — Express REST API (canonical backend)
├── supabase/
│   ├── migrations/        # PostgreSQL migration files
│   └── seed/              # Development seed data
└── docs/                  # Project documentation
```

## Three architectural rules

1. **Business rules are centralized in the backend/domain layer.**
   Client applications contain UI logic only. Order creation, inventory validation, payment transitions, and authorization are decided by `@floria/api`.

2. **Client applications never directly access PostgreSQL.**
   All data flows: `Client → @floria/api-client → @floria/api → Supabase PostgreSQL`.

3. **Authorization is server-side.**
   Hiding a UI route is UX, not security. Every mutation and sensitive read is authorized by `@floria/api`.

## Security invariants

These variables must NEVER appear in any web or mobile client bundle:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `REDIS_URL`

See `docs/MULTI-APP-ARCHITECTURE.md` for full architecture reference.
