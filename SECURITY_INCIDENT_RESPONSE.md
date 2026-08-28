# Floria — Security Incident Response & Threat Mitigation Guide

---

## 1. Incident Classification

| Severity Level    | Definition                                                             | Response Time         |
| :---------------- | :--------------------------------------------------------------------- | :-------------------- |
| **P0 — Critical** | Data breach, unauthorized admin access, payment tampering, secret leak | $< 15\text{ minutes}$ |
| **P1 — High**     | Privilege escalation attempt, seller cross-access, auth degradation    | $< 1\text{ hour}$     |
| **P2 — Medium**   | Suspicious rate limit breaches, anomalous media uploads                | $< 4\text{ hours}$    |
| **P3 — Low**      | Minor policy violation, isolated client error spikes                   | $< 24\text{ hours}$   |

---

## 2. Response Procedures

### 2.1 Credential / Secret Compromise

1. **Immediate Revocation**:
   - Rotate Supabase Service Role Key and JWT signing secret.
   - Generate new Cashfree API Secret and Webhook Secret in Cashfree Dashboard.
2. **Re-deploy Backend**: Update production environment secrets in hosting vault and restart API cluster.
3. **Session Invalidation**: Terminate all active Supabase user sessions via admin RPC to force re-authentication.

### 2.2 Malicious Seller / Account Compromise

1. **Emergency Suspension**: Admin invokes `POST /api/v1/admin/sellers/:id/suspend` from Admin Web or Admin Mobile.
2. **Catalog Suppression**: All associated botanical listings automatically transition to `flagged`/`unlisted` via database trigger.
3. **Audit Log Inspection**: Review immutable audit trail (`/api/v1/admin/audit-logs`) to trace unauthorized changes.

### 2.3 Webhook / Payment Fraud Attempt

1. **Signature Verification Guard**: Unsigned or invalid signature payloads return HTTP 401 and are dropped before database touch.
2. **IP Blacklisting**: Block offending IP addresses at Cloudflare / Edge Proxy.
3. **Reconciliation**: Audit Cashfree settlement logs against PostgreSQL transaction records.
