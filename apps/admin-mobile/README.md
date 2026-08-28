# @floria/admin-mobile — Admin Mobile App (iOS + Android)

**Status**: Architecture boundary established. Feature development not yet started.

## Purpose

Operational command app for Floria platform administrators. **Not a mobile replica of `@floria/admin-web`.**
The admin web portal is the primary control center. This app provides mobile access for urgent operational situations.

## Planned features (not yet implemented)

- Critical alerts and push notifications
- Order issue escalation
- Seller issue review (approve/suspend on mobile)
- Delivery issue management
- Payment dispute overview
- Operational metrics overview
- Limited permitted actions (with server-side enforcement)
- Sensitive operations may require re-authentication

## Security note

All administrative actions are authorized server-side by `@floria/api`.
This mobile client cannot grant itself elevated permissions.
Hiding a UI element is not security — the API enforces authorization.

## Architecture

```
@floria/admin-mobile (React Native + Expo)
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

## Tech stack

- React Native 0.79 / Expo SDK 53 / Expo Router 5 / TypeScript
