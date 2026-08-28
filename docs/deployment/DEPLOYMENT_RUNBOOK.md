# Floria — Deployment Runbook & Operational Procedures

---

## 1. Pre-Deployment Validation Checklist

Before initiating any deployment, verify:

1. **Clean Working Tree**: `git status` shows no untracked secrets or unexpected files.
2. **Type Safety**: `pnpm -r run typecheck` exits with 0 errors across all 11 workspace packages.
3. **Full Test Suite**: `pnpm test` and workspace tests pass 317/317 tests with 0 failures.
4. **Environment Audit**: No production secrets or service role keys present in client configuration files.

---

## 2. Current Deployment Architecture

- **Hosted Customer Web**: `https://floriaa-web.vercel.app` (Vercel)
- **Hosted Backend API**: `https://floria-api.onrender.com` (Render)

---

## 3. Standard Deployment Sequence

Deploy in this exact order to preserve schema and API compatibility:

```text
STEP 1: Database Migrations (Idempotent PostgreSQL roll-forward via Supabase)
   ↓
STEP 2: API Packages & Backend (packages/api-client -> backend/api on Render)
   ↓
STEP 3: Customer Web (apps/web on Vercel)
   ↓
STEP 4: Seller & Admin Web (apps/seller-web & apps/admin-web)
   ↓
STEP 5: Mobile Applications (apps/*-mobile via Expo / EAS)
```

---

## 4. Verification Endpoints

```bash
# 1. API Liveness Check
curl -s https://floria-api.onrender.com/health
# Expected: {"status":"healthy","service":"floria-api",...}

# 2. API Readiness & Database Check
curl -s https://floria-api.onrender.com/ready
# Expected: {"status":"ready","database":"connected"}

# 3. Customer Web Edge Check
curl -I https://floriaa-web.vercel.app
# Expected: HTTP/2 200
```

---

## 5. Rollback Procedure

If 5xx error rate spikes or critical anomalies occur:

1. **Render API**: Roll back to the previous stable release commit/build in the Render Dashboard.
2. **Vercel Web**: Roll back to the previous instant deployment alias in the Vercel Dashboard.
3. **Database Schema Rule**: Expand-contract migration policy ensures previous application versions remain functional without reverting database tables.
