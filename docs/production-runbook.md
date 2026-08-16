# Floria — Production Operations Runbook

This document is the operational manual for engineers managing Floria in production. It covers deployment, health checks, log inspection, secret rotation, incident response, rollback, and feature toggling.

---

## 1. Deployment Procedures

### Web Frontend (Next.js)
1. Push approved code to `main` branch.
2. Vercel automatically builds and deploys `apps/web`.
3. Verify build status on host dashboard.

### Backend API (Render)
1. Push approved code to `main` branch.
2. Render automatically triggers `buildCommand` (`pnpm install && pnpm --filter @floria/api build`) and starts `startCommand` (`pnpm --filter @floria/api start`).
3. Render waits for `GET /health` to return `200 OK` before switching traffic.

---

## 2. Health Check & Diagnostics

- **Liveness Check**:
  ```bash
  curl -i https://api.floria.in/health
  ```
  *Expected Output*: `200 OK`, `{"status":"healthy","service":"floria-api"}`

- **Database Readiness Check**:
  ```bash
  curl -i https://api.floria.in/ready
  ```
  *Expected Output*: `200 OK`, `{"status":"ready","database":"connected"}`

---

## 3. Log Inspection

- **Backend API Logs**:
  Inspect stdout logs in Render dashboard. Logs include structured JSON formatting with `X-Request-ID`, `method`, `url`, `status`, `durationMs`, and `userId`.
- **Database Logs**:
  Inspect PostgreSQL logs in Supabase Dashboard → Logs → Postgres. Look for long-running queries (>1000ms) or connection limit warnings.

---

## 4. Secret Rotation Procedure

If a secret key (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, or `RAZORPAY_KEY_SECRET`) is compromised:

1. **Supabase Key Rotation**:
   - Go to Supabase Dashboard → Project Settings → API.
   - Click **Roll JWT Secret** or **Generate New Service Role Key**.
2. **Environment Variable Update**:
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Render environment variables for `floria-api`.
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables for `apps/web`.
3. **Redeploy Services**:
   - Trigger immediate manual redeployment on Render and Vercel.
4. **Audit Logs**:
   - Query `audit_logs` table in PostgreSQL for unauthorized admin actions taken during the compromise window.

---

## 5. Outage & Emergency Incident Response

1. **Identify Failure Layer**:
   - Run `curl https://api.floria.in/health` and `curl https://api.floria.in/ready`.
   - If `/health` fails: Backend container down → Restart container on Render.
   - If `/ready` fails: Supabase database connection down / pool exhausted → Check Supabase status page and active connection count.
2. **Rollback Application Code**:
   - Render: Select previous successful build version → **Rollback**.
   - Vercel: Select previous successful deployment → **Promote to Production**.

---

## 6. Disabling Problematic Features
- To disable review submissions during spam attack: Set rate limit to 0 or toggle feature flag in platform settings.
- To disable checkout during payment gateway outage: Set `paymentMethod` check to COD only or update status banner.
