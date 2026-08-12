# Floria — Multi-vendor Plant Marketplace

Production-ready, mobile-first multi-vendor marketplace for plants and gardening products.

## Stack

- **Web**: Next.js 15 + TypeScript + App Router
- **UI**: React + Tailwind CSS
- **Backend/Data**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments**: Razorpay (pending eligibility/compliance)
- **Hosting**: Vercel
- **Future mobile**: Expo + React Native + TypeScript

## Monorepo structure

```
floria/
├── apps/
│   └── web/          # Next.js customer + seller + admin web app
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Shared Zod validation schemas
│   ├── ui/           # Shared UI primitives (future)
│   └── api/          # Shared API helpers (future)
├── supabase/
│   ├── migrations/   # PostgreSQL migration files
│   └── seed/         # Development seed data
└── docs/             # Project documentation
```

## Quick start

```bash
cp .env.example .env.local   # fill in required values
pnpm install
pnpm dev                     # http://localhost:3000
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Product Requirements](docs/01-PRODUCT-REQUIREMENTS.md) | Features and MVP scope |
| [Business Rules](docs/02-BUSINESS-RULES.md) | Domain rules |
| [Architecture](docs/03-ARCHITECTURE.md) | Technical decisions |
| [Design System](docs/04-DESIGN-SYSTEM.md) | Visual language |
| [Order Lifecycle](docs/05-ORDER-LIFECYCLE.md) | State machine |
| [Page Map](docs/06-PAGE-MAP.md) | Route structure |
| [Security](docs/07-SECURITY.md) | Auth and data isolation |
| [Testing](docs/08-TESTING.md) | Test strategy |
| [Definition of Done](docs/09-DEFINITION-OF-DONE.md) | Acceptance criteria |
| [Monday Demo](docs/10-MONDAY-DEMO.md) | Demo checklist |

## Key business rules

- No nearby-nursery selection — the purchased listing determines the fulfilling nursery.
- One nursery per MVP order.
- Never trust client-side price, stock, seller ID or payment success.
- Authorization is server-side.
- Webhook verification is idempotent.
- Orders are immutable snapshots.
- Commission is configurable (rate not finalized).
