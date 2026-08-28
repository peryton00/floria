# Floria — Disaster Recovery & Business Continuity Plan

**Authoritative Standard:** Step 13 Production Hardening
**Target Recovery Time Objective (RTO):** $\le 30\text{ minutes}$
**Target Recovery Point Objective (RPO):** $\le 5\text{ minutes}$ (continuous WAL archiving)

---

## 1. Outage Scenarios & Remediation

### 1.1 Database Outage / Corruption

1. **Detection**: Health checks at `/ready` fail with `database: disconnected`.
2. **Containment**: API automatically returns `503 Service Unavailable` with `Retry-After: 30` header.
3. **Recovery**:
   - Restore PostgreSQL state from the most recent Supabase PITR (Point-in-Time Recovery) snapshot.
   - Run migration idempotency verification: `supabase db push` / `pnpm migrate`.
4. **Validation**: Execute API health verification suite (`tests/api.test.ts`).

### 1.2 Payment Gateway (Cashfree) Degraded / Unavailable

1. **Detection**: Cashfree API latency $> 5000\text{ms}$ or error rate $> 5\%$.
2. **Containment**: Customer checkout gracefully disables online payment and surfaces standard COD (Cash on Delivery) mode or requests later retry.
3. **Recovery**: Webhook reconciliation job (`POST /api/v1/payments/reconcile`) replays any unacknowledged payment sessions once Cashfree status restores.

### 1.3 Storage / Media Pipeline Failure

1. **Detection**: `POST /api/v1/media/upload-session` failure spike.
2. **Containment**: Clients cache media locally (e.g. Delivery POD images stored offline in AsyncStorage) and retry with exponential backoff.
3. **Recovery**: Process retry queue once storage endpoints return HTTP 200.

### 1.4 Bad Production Deployment

1. **Rollback Trigger**: API 5xx error rate $> 1\%$ for 5 consecutive minutes or breaking authentication failure.
2. **Action**: Revert production deployment to previous immutable container image / commit hash.
3. **Database Migration Rule**: Expand-contract migration policy ensures backward schema compatibility.

---

## 2. Disaster Communication Protocol

1. **Incident Commander**: Lead Platform Engineer.
2. **Status Updates**: Dispatched every 15 minutes to internal operations channel.
3. **Customer Transparency**: Status banner surfaced at top of Customer Web and Mobile.
