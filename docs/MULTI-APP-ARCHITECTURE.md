# Floria Multi-Application Architecture

> **Principle: Separate the applications, not the platform.**

Floria is a single marketplace platform served by one authoritative API and one PostgreSQL database. Client applications are separated by role. Business rules are not.

---

## Platform diagram

```
                         FLORIA PLATFORM
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
          CUSTOMER           SELLER              ADMIN
              │                 │                  │
        ┌─────┴─────┐     ┌─────┴─────┐      ┌─────┴─────┐
        │           │     │           │      │           │
       WEB        MOBILE  WEB       MOBILE   WEB       MOBILE
  @floria/web  customer  seller    seller  admin-web  admin
              mobile     web      mobile              mobile
        └─────┬─────┘     └─────┬─────┘      └─────┬─────┘
              │                 │                  │
              └─────────────────┼─────────────────┘
                                │
                         DELIVERY MOBILE
                          delivery-mobile
                                │
                                ▼
                    ┌───────────────────────┐
                    │      @floria/api       │
                    │   Node.js / Express   │
                    │     /api/v1/*         │
                    └───────────┬───────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
     PostgreSQL              Storage              Workers
     Supabase               Supabase           Redis / BullMQ
          │
          ├── Supabase Auth
          └── Cashfree Payment Gateway
```

---

## Applications

### Customer surfaces

| App                | Package                   | Port | Purpose                                                                |
| ------------------ | ------------------------- | ---- | ---------------------------------------------------------------------- |
| Customer Web (MVP) | `@floria/web`             | 3000 | Discovery, product browsing, cart, checkout, orders, wishlist, reviews |
| Customer Mobile    | `@floria/customer-mobile` | —    | Same as Customer Web, native iOS + Android                             |

> During MVP, Customer Web is served by `@floria/web` alongside Seller and Admin surfaces. This is the `apps/web/` Next.js application.

### Seller surfaces

| App           | Package                 | Port | Purpose                                                                              |
| ------------- | ----------------------- | ---- | ------------------------------------------------------------------------------------ |
| Seller Web    | `@floria/seller-web`    | 3001 | Full store management — products, inventory, orders, fulfillment, analytics, payouts |
| Seller Mobile | `@floria/seller-mobile` | —    | Operational access — order alerts, inventory updates, quick edits, store status      |

> During MVP, Seller Web surfaces live at `/seller/*` inside `@floria/web`. `@floria/seller-web` is the dedicated shell for eventual extraction.
> Seller Mobile is **not** a mobile clone of Seller Web — it is optimized for on-the-go operational tasks.

### Admin surfaces

| App          | Package                | Port | Purpose                                                                                                   |
| ------------ | ---------------------- | ---- | --------------------------------------------------------------------------------------------------------- |
| Admin Web    | `@floria/admin-web`    | 3002 | Primary control center — customers, sellers, products, orders, payments, delivery, reports, config, audit |
| Admin Mobile | `@floria/admin-mobile` | —    | Urgent operational access — alerts, critical issues, limited actions                                      |

> During MVP, Admin Web surfaces live at `/admin/*` inside `@floria/web`. `@floria/admin-web` is the dedicated shell for eventual extraction.
> Admin Mobile is **not** a mobile clone of Admin Web — it is for urgent mobile access only.

### Delivery surface

| App             | Package                   | Port | Purpose                                                                              |
| --------------- | ------------------------- | ---- | ------------------------------------------------------------------------------------ |
| Delivery Mobile | `@floria/delivery-mobile` | —    | Assigned deliveries, navigation, pickup, delivery status, proof of delivery, history |

> No Delivery Web application is planned.

---

## Shared packages

| Package                | Name                 | Purpose                                                                        |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `packages/api-client/` | `@floria/api-client` | Universal typed `fetch` client — consumed by all web and mobile apps           |
| `packages/types/`      | `@floria/types`      | Canonical TypeScript domain types (User, Order, Product, Seller, etc.)         |
| `packages/validation/` | `@floria/validation` | Shared Zod schemas — UX validation in clients, authoritative validation in API |

### @floria/api-client

The API client is the **only** way client applications communicate with the backend. It is built with pure TypeScript and `fetch`, making it compatible with:

- Next.js (web)
- React Native / Expo (mobile)
- Node.js (server-side rendering)

```typescript
// All client apps instantiate the same client:
const api = new FloriaApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL, // or EXPO_PUBLIC_API_URL
  getAccessToken: () =>
    supabase.auth
      .getSession()
      .then((s) => s.data.session?.access_token ?? null),
});
```

---

## The backend

### @floria/api

Single Express REST API at `backend/api/`. All business logic lives here.

**What it owns:**

- Order creation, validation, and state machine
- Inventory validation and reservation
- Price calculation (never trust client price)
- Payment intent creation and verification (Cashfree)
- Authorization (role + ownership + permission checks)
- Notification dispatch
- Media processing queue (BullMQ + Sharp)
- Seller commission and payout ledger

**There is no:**

- Customer API
- Seller API
- Admin API
- Delivery API

All clients use the same API, differentiated by the authenticated user's role.

---

## Three architectural rules

### 1. Business rules are centralized in the backend/domain layer

Order creation, inventory validation, payment state transitions, pricing rules, and authorization are defined by `@floria/api`.

**Client applications must not:**

- Calculate final prices
- Validate stock availability for order creation
- Decide payment success
- Grant themselves permissions
- Contain duplicate authorization logic

**Client applications may:**

- Perform UX validation (form field formats, required fields)
- Show optimistic UI
- Cache responses locally

### 2. Client applications never directly access PostgreSQL

```
Client
  ↓
@floria/api-client
  ↓
@floria/api  (Express)
  ↓
Domain / Service layer
  ↓
Repository layer
  ↓
Supabase PostgreSQL
```

No `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in any client application.

### 3. Authorization is server-side

Authentication flow:

```
User → Supabase Auth → JWT token → @floria/api → role + permission + ownership check
```

- Hiding a route or button in the UI is UX, not security
- Every mutation and sensitive read is authorized by the API
- Cross-seller and cross-user data isolation is enforced at the repository layer

---

## Environment variable rules

| Variable                        | Belongs in                  |
| ------------------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`           | Web client `.env.local`     |
| `NEXT_PUBLIC_SUPABASE_URL`      | Web client `.env.local`     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web client `.env.local`     |
| `EXPO_PUBLIC_API_URL`           | Mobile `.env.local`         |
| `EXPO_PUBLIC_SUPABASE_URL`      | Mobile `.env.local`         |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile `.env.local`         |
| `SUPABASE_SERVICE_ROLE_KEY`     | `backend/api/.env` **only** |
| `CASHFREE_CLIENT_SECRET`        | `backend/api/.env` **only** |
| `CASHFREE_WEBHOOK_SECRET`       | `backend/api/.env` **only** |
| `DATABASE_URL`                  | `backend/api/.env` **only** |
| `REDIS_URL`                     | `backend/api/.env` **only** |

---

## Deployment model

| Application               | Deployment target                            |
| ------------------------- | -------------------------------------------- |
| `@floria/web`             | Vercel                                       |
| `@floria/seller-web`      | Vercel (separate project)                    |
| `@floria/admin-web`       | Vercel (separate project, restricted access) |
| `@floria/api`             | Render                                       |
| `@floria/customer-mobile` | Expo / EAS → App Store + Google Play         |
| `@floria/seller-mobile`   | Expo / EAS → App Store + Google Play         |
| `@floria/admin-mobile`    | Expo / EAS → TestFlight / internal track     |
| `@floria/delivery-mobile` | Expo / EAS → App Store + Google Play         |

---

## Migration path: @floria/web → dedicated portals

`@floria/web` currently hosts Customer, Seller, and Admin surfaces together for MVP velocity.

Planned extraction order (incremental, non-destructive):

1. **Seller Web** — extract `/seller/*` routes from `@floria/web` into `@floria/seller-web`
2. **Admin Web** — extract `/admin/*` and `/operations/*` routes into `@floria/admin-web`
3. **Customer Web** — `@floria/web` becomes a pure customer app, or rename to `@floria/customer-web`

Each extraction:

- Does not break the existing app
- Uses the same `@floria/api` backend
- Uses the same `@floria/api-client`
- Moves routes, not business logic

---

## Authentication & Authorization Reference

### 1. Identity Flow

```
User credentials / OAuth → Supabase Auth (Identity Provider)
   │
   ▼
Access Token (JWT)
   │
   ▼
Authorization: Bearer <token>
   │
   ▼
@floria/api (authenticateToken middleware)
   ├── Verify token via Supabase Auth
   ├── Resolve user_id from verified JWT claims
   ├── Resolve server-side role from user_profiles
   ├── Resolve seller_id & seller_status (for sellers)
   └── Attach authoritative req.user to request
```

### 2. Role Boundaries

| Role                    | Permitted Applications                          | Authorization Scope                                                          |
| ----------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `customer`              | Customer Web, Customer Mobile                   | Own cart, wishlist, orders, profile, addresses, verified reviews             |
| `seller`                | Seller Web, Seller Mobile, Customer surfaces    | Approved nursery products, inventory, fulfillment orders, earnings           |
| `operations`            | Delivery Mobile, Admin Web (operations section) | Order dispatch, delivery assignments, packing, pickup logistics              |
| `admin` / `super_admin` | Admin Web, Admin Mobile, All surfaces           | Full moderation, user status, pricing policies, financial config, audit logs |

### 3. Session & Error Handling

- **401 Unauthorized**: Unauthenticated or expired session. Client clears auth state and triggers login / session refresh.
- **403 Forbidden**: Authenticated identity lacks permission for the requested resource. Client displays an access-denied state without logging the user out.
- **Delivery Role Architecture**: Delivery operations currently use the `operations` role. If dedicated individual contractor boundaries (e.g. driver-specific assigned route filters) are required, a future non-destructive role migration can introduce `delivery_partner`.
