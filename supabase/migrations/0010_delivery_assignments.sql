-- ============================================================
-- Floria — Delivery Assignments Table
-- Migration: 0010_delivery_assignments.sql
-- Operational delivery workflow & logistics assignment tracking.
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_assignments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             TEXT NOT NULL,
  assigned_to          TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'picked_up', 'out_for_delivery', 'delivered'
  assigned_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  picked_up_at         TIMESTAMPTZ,
  out_for_delivery_at  TIMESTAMPTZ,
  delivered_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);
