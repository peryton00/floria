-- ============================================================
-- Floria — Migration 0028: Delivery POD Metadata & Enums
-- Step 5B.3: Proof of Delivery media asset linkage and recipient metadata
-- ============================================================

-- 1. Extend media_type_category ENUM to include 'DELIVERY_POD'
DO $$ BEGIN
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'DELIVERY_POD';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add POD columns to delivery_assignments (Additive & Forward-safe)
ALTER TABLE delivery_assignments
  ADD COLUMN IF NOT EXISTS pod_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS pod_notes TEXT;

-- 3. Create Index on pod_asset_id for performant lookups
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_pod_asset
  ON delivery_assignments(pod_asset_id);
