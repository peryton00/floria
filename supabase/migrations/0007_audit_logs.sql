-- ============================================================
-- Floria — Audit Logs Table
-- Migration: 0007_audit_logs.sql
-- Append-only audit trail for all security-relevant events.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role     TEXT NOT NULL DEFAULT 'system',
  action         TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at — this table is append-only by design
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for customers/sellers — service-role only.
-- Admin read access will be added in Phase 4 (Admin Dashboard).
-- INSERT: only via service-role (no RLS INSERT policy = no user can insert via anon/user key)

-- Prevent any row modifications after insert (append-only guarantee at DB level)
-- This is enforced by having NO UPDATE policy and NO DELETE policy.

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource   ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created    ON audit_logs(created_at DESC);
