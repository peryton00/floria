# Floria — Production Database Backup & Disaster Recovery Strategy

This document defines the verified database backup schedule, retention policies, Point-In-Time Recovery (PITR) availability, and restoration procedures for the Floria production environment on Supabase PostgreSQL.

---

## 1. Backup Specifications

| Parameter                         | Configuration / Specification                                   |
| --------------------------------- | --------------------------------------------------------------- |
| **Database Host**                 | Supabase Managed Cloud PostgreSQL                               |
| **Automatic Backups**             | Daily Automated Daily Snapshots (Supabase Pro/Enterprise tier)  |
| **Point-In-Time Recovery (PITR)** | Enabled (7-day physical write-ahead log stream)                 |
| **Backup Retention**              | 7 Days (PITR), 30 Days (Daily Snapshots)                        |
| **Storage Location**              | Multi-region encrypted cloud object storage managed by Supabase |
| **Encryption Standard**           | AES-256 at rest, TLS 1.3 in transit                             |

---

## 2. Recovery Objectives

- **Recovery Point Objective (RPO)**:
  - **With PITR**: ~2 minutes (up to nearest write-ahead log segment)
  - **Without PITR (Daily Backup)**: ≤ 24 hours
- **Recovery Time Objective (RTO)**:
  - **DB Restoration**: ≤ 30 minutes for automated PITR restore or snapshot restore.

---

## 3. Restoration Procedure

### A. Point-In-Time Recovery (PITR) Restore via Supabase Dashboard

1. Log into **Supabase Management Dashboard**.
2. Navigate to **Project Settings → Database → Backups → Point in Time Recovery**.
3. Select **Restore to a Point in Time**.
4. Specify target recovery timestamp (UTC) prior to incident.
5. Confirm restoration. Supabase provisions a restored clone or overwrites existing database instance cleanly.

### B. Manual Backup Export (PG_DUMP)

To create an offline developer backup before executing major schema migrations:

```bash
pg_dump -h db.<project-ref>.supabase.co -U postgres -d postgres -F c -b -v -f floria_prod_backup_$(date +%Y%m%d).dump
```

To restore a manual pg_dump file to Staging database:

```bash
pg_restore -h db.<staging-ref>.supabase.co -U postgres -d postgres -v -c floria_prod_backup_20260816.dump
```

---

## 4. Verification & Backup Testing

- Backup restoration testing must be performed quarterly against a designated staging branch/database instance.
- **NEVER** perform test restores directly on the live production database.
