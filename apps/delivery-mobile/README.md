# @floria/delivery-mobile — Delivery Partner App (iOS + Android)

**Status**: Architecture boundary established. Feature development not yet started.

## Purpose

Native mobile app for Floria delivery partners. This is the most hardware-integrated application in the platform — it uses location, camera, and push notifications as core features.

## Planned features (not yet implemented)

- View assigned deliveries queue
- Delivery details (addresses, items, customer contact)
- In-app navigation to pickup and drop-off locations
- Mark pickup confirmed
- Update delivery status (picked up → out for delivery → delivered)
- Customer contact (phone/WhatsApp)
- Proof of delivery (photo capture)
- Delivery history
- Push notifications for new assignments
- Location tracking during active delivery
- Offline resilience for poor connectivity areas

## Native permissions (declared in app.json)

- `ACCESS_FINE_LOCATION` / `ACCESS_BACKGROUND_LOCATION` — delivery tracking
- `CAMERA` — proof of delivery photos
- `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription` (iOS)
- `NSCameraUsageDescription` (iOS)

> **When implementing location and camera features**, add `expo-location` and `expo-camera` as dependencies at that time. Do not add them as part of the architecture shell — they require native build configuration.

## Architecture

```
@floria/delivery-mobile (React Native + Expo)
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
- Auth: Supabase Auth JWT (role: `operations` / delivery partner)
- Delivery status updates are server-side validated and persisted
- Location data never stored client-side permanently

## Tech stack

- React Native 0.79 / Expo SDK 53 / Expo Router 5 / TypeScript
- Future: `expo-location`, `expo-camera`, `expo-notifications`

## Running locally

```bash
cp .env.example .env.local
pnpm --filter @floria/delivery-mobile start
```
