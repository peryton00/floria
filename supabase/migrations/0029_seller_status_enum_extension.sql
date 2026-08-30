-- ============================================================
-- Floria — Migration 0029: Extend seller_status ENUM
-- Extends the seller_status enum type with onboarding lifecycle values.
-- ============================================================

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'application_incomplete';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'application_submitted';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'under_review';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'needs_correction';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'active';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE seller_status ADD VALUE IF NOT EXISTS 'deactivated';
EXCEPTION WHEN duplicate_object THEN null; END $$;
