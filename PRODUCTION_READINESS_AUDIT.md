# Floria — Production Readiness Audit

**Generated:** August 2026
**Status:** Canonical Audit Baseline
**Scope:** Full Ecosystem (7 Client Applications, Express API, Supabase PostgreSQL, Cashfree Gateway, Media Pipeline)

---

## 1. Executive Summary

Floria is a high-availability, multi-application local botanical commerce marketplace. This production readiness audit evaluates all architectural components for release safety, scalability, failure recovery, security, and operational predictability.

---

## 2. Production Architecture

```text
                    FLORIA ECOSYSTEM
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 Customer Surfaces   Seller Surfaces     Admin Surfaces
  • apps/web          • apps/seller-web   • apps/admin-web
  • apps/customer-    • apps/seller-      • apps/admin-
    mobile              mobile              mobile
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                    Delivery Mobile
                   • apps/delivery-mobile
                           │
                           ▼
                   @floria/api-client
                           │
                           ▼
                   Express REST API
                   (backend/api)
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
     Supabase Backend                  Cashfree PG
     • PostgreSQL (RLS, Migrations)    • Online Checkout
     • Supabase Auth (JWT)             • Webhook Ingestion
     • Supabase Storage (Private/Pub)  • Idempotent Reconciliation
```

---

## 3. Threat Model & Security Audit

| Surface           | Risk                        | Control Implemented                                                    | Status       |
| :---------------- | :-------------------------- | :--------------------------------------------------------------------- | :----------- |
| **API Auth**      | JWT spoofing / bypass       | Supabase Auth validation + `requireRole` server middleware             | **VERIFIED** |
| **RBAC Matrix**   | Cross-role resource access  | Express RBAC guards on `/customer`, `/seller`, `/admin`, `/operations` | **VERIFIED** |
| **IDOR**          | Unauthorized ID tampering   | Server-side session ownership checks (`seller_id`, `customer_id`)      | **VERIFIED** |
| **Payments**      | Webhook tampering / replay  | HMAC-SHA256 signature verification + event deduplication               | **VERIFIED** |
| **Inventory**     | Race condition overselling  | Atomic SQL reservations + row-level locking                            | **VERIFIED** |
| **Media Uploads** | Malicious payload execution | Magic-byte checks, MIME validation, ImageEngine WebP conversion        | **VERIFIED** |
| **Secrets**       | Leakage in client bundles   | Zero client secret exposure; environment boundary enforcement          | **VERIFIED** |

---

## 4. Environment Separation

- **Development**: Local environment with Mock/Sandbox credentials (`.env.example`).
- **Staging / Sandbox**: Cashfree Sandbox environment (`https://sandbox.cashfree.com/pg`), isolated Supabase test project.
- **Production**: Cashfree Live (`https://api.cashfree.com/pg`), Production Supabase PostgreSQL with automated daily WAL backups and point-in-time recovery.

---

## 5. Findings Classification

- **CRITICAL**: 0 open findings.
- **HIGH**: 0 open findings.
- **MEDIUM**: Push notification delivery worker hooks to be connected with production APNs/FCM certificates during app store provisioning.
- **LOW**: Log rotation policy configuration on production host.
