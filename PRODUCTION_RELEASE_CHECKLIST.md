# Floria — Production Release Checklist

---

### Phase 1: Environment & Secrets

- [x] Production environment variables verified across all applications (`.env.example` checked)
- [x] Zero client secrets or `service_role` keys present in web/mobile bundles
- [x] Cashfree live production API keys and webhook signing secret configured in backend vault
- [x] Supabase database connection pooling (PgBouncer/Supavisor) configured for production scale

### Phase 2: Security & Governance

- [x] Server-side RBAC middleware enforced on all sensitive routes
- [x] IDOR protection verified across customers, sellers, couriers, and administrators
- [x] Cashfree HMAC-SHA256 webhook signature validation and idempotency active
- [x] ImageEngine WebP compression and EXIF metadata stripping active
- [x] Rate limiting active on authentication, search, and checkout endpoints
- [x] Strict CORS policy restricting access to legitimate Floria domains

### Phase 3: Domain & Business Workflows

- [x] Customer cart and ₹49 delivery fee calculation coherent across Web and Mobile
- [x] Seller order queue, stock management, and fulfillment status machine active
- [x] Delivery mobile dispatch assignment, courier handoff, and POD verification active
- [x] Admin partner approvals, catalog moderation, and immutable audit logs active
- [x] Canonical money calculations in Paise with integer arithmetic (zero floating-point leaks)

### Phase 4: Verification & Quality Gates

- [x] Full workspace TypeScript typecheck: 0 compilation errors across 7 apps and packages
- [x] Full workspace unit and integration test suite: 242 tests passing (0 failures)
- [x] All 3 Web applications build successfully (`apps/web`, `apps/seller-web`, `apps/admin-web`)
- [x] All 4 Mobile applications pass Expo entry point and TypeScript checks
- [x] Zero active Razorpay references or SDKs in codebase
- [x] Cashfree Easy Split settlement intentionally deferred and isolated
