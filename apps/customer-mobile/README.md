# @floria/customer-mobile — Customer Mobile App (iOS + Android)

**Status**: Architecture boundary established. Feature development not yet started.

## Purpose

Native mobile app for Floria customers on iOS and Android. Built with React Native + Expo + Expo Router.

## Planned features (not yet implemented)

- Product discovery and browsing
- Search
- Product detail pages
- Nursery/seller discovery
- Cart
- Checkout with Cashfree payment
- Orders and order tracking
- Wishlist
- Reviews
- Customer account management
- Push notifications

## Architecture

```
@floria/customer-mobile (React Native + Expo)
         │
         ▼
@floria/api-client
         │
         ▼
@floria/api (Express — single backend)
         │
         ▼
  Supabase PostgreSQL
```

**Rules:**

- All data access goes through `@floria/api-client` → `@floria/api`
- No direct PostgreSQL access from this application
- No business logic duplicated from `@floria/api`
- Auth: Supabase Auth JWT, passed as `Authorization: Bearer <token>` header
- Payment: Cashfree SDK integrated via WebView or native SDK — payment verification is server-side

## Running locally

```bash
cp .env.example .env.local   # fill in values
pnpm --filter @floria/customer-mobile start
# Scan QR with Expo Go or use iOS/Android simulator
```

## Environment variables

Expo uses `EXPO_PUBLIC_*` prefix for variables safe to embed in the mobile bundle.
Server secrets never go in mobile apps.

## Tech stack

- React Native 0.79
- Expo SDK 53
- Expo Router 5 (file-based routing)
- TypeScript
- `@floria/api-client` for all API calls
- `@floria/types` for shared domain types
