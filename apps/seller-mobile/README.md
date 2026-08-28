# @floria/seller-mobile — Seller Mobile App (iOS + Android)

**Status**: Architecture boundary established. Feature development not yet started.

## Purpose

Operational command app for Floria sellers. **Not a mobile duplicate of `@floria/seller-web`.**
The seller web portal is for full management. This app is for on-the-go operational access.

## Planned features (not yet implemented)

- New order alerts and push notifications
- Quick order review and acceptance
- Inventory quantity updates
- Product availability toggles (in stock / out of stock)
- Quick product edits
- Store open/closed status
- Basic sales overview
- Delivery status tracking

## Architecture

```
@floria/seller-mobile (React Native + Expo)
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
- No direct PostgreSQL access
- Auth: Supabase Auth JWT (role: `seller`, status: `approved`)
- Authorization enforced server-side; UI restrictions alone are not sufficient

## Tech stack

- React Native 0.79 / Expo SDK 53 / Expo Router 5 / TypeScript
