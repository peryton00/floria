-- ============================================================
-- Floria — Migration 0038: Reconcile Seller Onboarding & Authentication
-- Ensures idempotent reconciliation of seller lifecycle enum states,
-- columns, credential storage, and application review workflows
-- regardless of which 0029 migration was previously applied.
-- ============================================================

-- 1. Ensure all seller_status ENUM values exist
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

-- 2. Ensure columns exist on seller_profiles
ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS public_seller_id TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS gst_status TEXT DEFAULT 'pending_verification';

-- 3. Backfill public_seller_id for existing seller_profiles if null
UPDATE seller_profiles
SET public_seller_id = 'FLR-SLR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
WHERE public_seller_id IS NULL;

DO $$ BEGIN
  ALTER TABLE seller_profiles ALTER COLUMN public_seller_id SET NOT NULL;
EXCEPTION WHEN others THEN null; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_seller_profiles_public_id
  ON seller_profiles(public_seller_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_seller_profiles_username
  ON seller_profiles(LOWER(username))
  WHERE username IS NOT NULL;

-- 4. Create seller_credentials table for secure password storage
CREATE TABLE IF NOT EXISTS seller_credentials (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  public_seller_id        TEXT NOT NULL,
  username                TEXT NOT NULL,
  email                   TEXT NOT NULL,
  password_hash           TEXT NOT NULL,
  password_salt           TEXT NOT NULL,
  password_algo           TEXT NOT NULL DEFAULT 'scrypt',
  failed_login_attempts   INT NOT NULL DEFAULT 0,
  locked_until            TIMESTAMPTZ,
  password_updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_seller_credentials_seller_id UNIQUE (seller_id),
  CONSTRAINT uq_seller_credentials_public_id UNIQUE (public_seller_id),
  CONSTRAINT uq_seller_credentials_username UNIQUE (username),
  CONSTRAINT uq_seller_credentials_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_seller_credentials_lookup
  ON seller_credentials(LOWER(email), LOWER(username), LOWER(public_seller_id));

-- 5. Create seller_applications table
CREATE TABLE IF NOT EXISTS seller_applications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID REFERENCES seller_profiles(id) ON DELETE SET NULL,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username                TEXT NOT NULL,
  email                   TEXT NOT NULL,
  business_name           TEXT NOT NULL,
  business_type           TEXT DEFAULT 'nursery',
  business_description    TEXT,
  contact_phone           TEXT NOT NULL,
  address                 TEXT NOT NULL,
  city                    TEXT NOT NULL,
  state                   TEXT NOT NULL,
  postal_code             TEXT NOT NULL,
  gst_number              TEXT,
  gst_legal_name          TEXT,
  gst_status              TEXT DEFAULT 'pending_verification',
  settlement_account      JSONB,
  submitted_documents     JSONB DEFAULT '[]'::jsonb,
  status                  TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN (
                            'application_incomplete',
                            'application_submitted',
                            'under_review',
                            'needs_correction',
                            'approved',
                            'active',
                            'rejected',
                            'suspended',
                            'deactivated',
                            'pending'
                          )),
  rejection_reason        TEXT,
  correction_reason       TEXT,
  reviewed_at             TIMESTAMPTZ,
  reviewed_by             UUID REFERENCES user_profiles(id),
  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_applications_status
  ON seller_applications(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_seller_applications_email
  ON seller_applications(LOWER(email));

-- 6. Create seller_password_resets table
CREATE TABLE IF NOT EXISTS seller_password_resets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  token_hash              TEXT NOT NULL,
  expires_at              TIMESTAMPTZ NOT NULL,
  used_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_password_resets_token
  ON seller_password_resets(token_hash)
  WHERE used_at IS NULL;

-- 7. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seller_credentials_updated_at ON seller_credentials;
CREATE TRIGGER trg_seller_credentials_updated_at
  BEFORE UPDATE ON seller_credentials
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS trg_seller_applications_updated_at ON seller_applications;
CREATE TRIGGER trg_seller_applications_updated_at
  BEFORE UPDATE ON seller_applications
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- 8. Row Level Security Policies
ALTER TABLE seller_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_password_resets ENABLE ROW LEVEL SECURITY;
