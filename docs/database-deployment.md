# Floria — Database Deployment & Migration Procedure

This document details the mandatory procedure for reviewing, testing, applying, and rolling back PostgreSQL migrations on Floria's staging and production databases.

---

## 1. Sequential Migration Inventory

All schema changes must be stored as sequential SQL files in `supabase/migrations/`:

| Migration File | Description | Idempotent |
|---|---|---|
| `0001_initial_schema.sql` | Base tables, user profiles, products, orders | Yes |
| `0002_wishlists.sql` | Wishlist schema and item tracking | Yes |
| `0003_multi_nursery_cart.sql` | Multi-nursery sub-cart grouping | Yes |
| `0004_seed_data.sql` | Base nursery catalog seed | Yes |
| `0005_seed_permissions.sql` | Base RBAC system roles | Yes |
| `0006_seller_order_fulfillments.sql` | Sub-order fulfillment & item states | Yes |
| `0007_audit_logs.sql` | Administrative security audit trail | Yes |
| `0008_db_constraints.sql` | Integrity foreign keys & checks | Yes |
| `0009_rbac_enforcement.sql` | Strict Row Level Security (RLS) policies | Yes |
| `0010_delivery_assignments.sql` | Operations delivery agent table | Yes |
| `0011_platform_settings.sql` | Platform commission & global settings | Yes |
| `0012_auto_user_profile_trigger.sql` | Trigger for automatic profile creation | Yes |
| `0013_seller_documents.sql` | Seller KYC document storage table | Yes |
| `0014_seller_notification_settings.sql` | Seller preference toggles | Yes |
| `0015_notifications.sql` | In-app notifications table | Yes |
| `0016_product_reviews.sql` | Reviews & moderation table | Yes |
| `0017_reviews_and_recommendations.sql` | Rating summaries & Wilson score RPCs | Yes |

---

## 2. Migration Execution Rules

1. **Destructive Reset Ban**: `DROP DATABASE` or `supabase db reset` must **NEVER** be run against staging or production databases.
2. **Expand → Migrate → Contract Pattern**:
   - Step 1 (Expand): Add new columns/tables without removing old ones.
   - Step 2 (Migrate): Deploy code using both old and new columns.
   - Step 3 (Contract): Remove deprecated columns in a subsequent release once verified.

---

## 3. Migration Step-by-Step Workflow

1. **Local Authoring**:
   - Write new SQL migration in `supabase/migrations/<NNNN>_<feature_name>.sql`.
   - Test locally against development PostgreSQL.
2. **Peer Review**:
   - Review migration SQL in Pull Request for missing indexes, RLS gaps, or unsafe locks.
3. **Staging Execution**:
   - Apply migration to Staging Supabase database via Supabase CLI (`supabase db push --db-url <staging-url>`) or SQL Editor.
   - Run integration & E2E smoke tests on Staging.
4. **Production Execution**:
   - Take manual snapshot of production DB (`pg_dump`).
   - Execute migration script on Production Supabase DB.
   - Run post-deployment health check (`GET /ready`).

---

## 4. Rollback Procedure

- **Schema Additions**: If an added column/table breaks production, deploy hotfix API version that stops querying it, then drop column in a revert migration.
- **Data Corruption**: If data integrity is compromised, restore to latest PITR timestamp prior to migration timestamp (see [`docs/production-backup.md`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/docs/production-backup.md)).
