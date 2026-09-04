-- ============================================================
-- Floria — Phase 6: Delivery Partner Ecosystem Architecture
-- Migration: 0034_delivery_partner_ecosystem.sql
-- ============================================================

-- 1. Extend user_role ENUM to include 'delivery_partner'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'user_role' AND pg_enum.enumlabel = 'delivery_partner'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'delivery_partner';
  END IF;
END $$;

-- 2. Create delivery_partner_applications table
CREATE TABLE IF NOT EXISTS delivery_partner_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(30) NOT NULL,
  city                VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
  vehicle_type        VARCHAR(50) NOT NULL DEFAULT 'two_wheeler',
  vehicle_number      VARCHAR(50) NOT NULL,
  driving_license     VARCHAR(100) NOT NULL,
  status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason    TEXT,
  submitted_documents JSONB DEFAULT '[]'::jsonb,
  reviewed_by         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_applications_status
  ON delivery_partner_applications(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_applications_email
  ON delivery_partner_applications(LOWER(email));

-- 3. Create delivery_partners table (Authoritative Courier Profile)
CREATE TABLE IF NOT EXISTS delivery_partners (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE REFERENCES user_profiles(id) ON DELETE SET NULL,
  public_partner_id   VARCHAR(30) NOT NULL UNIQUE,
  full_name           TEXT NOT NULL,
  email               VARCHAR(255) NOT NULL UNIQUE,
  phone               VARCHAR(30) NOT NULL,
  city                VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
  vehicle_type        VARCHAR(50) NOT NULL DEFAULT 'two_wheeler',
  vehicle_number      VARCHAR(50) NOT NULL,
  driving_license     VARCHAR(100) NOT NULL,
  status              VARCHAR(30) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'suspended', 'inactive')),
  on_duty             BOOLEAN NOT NULL DEFAULT false,
  active_delivery_id  UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id
  ON delivery_partners(user_id);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_status
  ON delivery_partners(status);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_on_duty
  ON delivery_partners(on_duty);

-- 4. Create delivery_partner_credentials table (Activation & Security)
CREATE TABLE IF NOT EXISTS delivery_partner_credentials (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id              UUID NOT NULL UNIQUE REFERENCES delivery_partners(id) ON DELETE CASCADE,
  user_id                 UUID UNIQUE REFERENCES user_profiles(id) ON DELETE SET NULL,
  email                   VARCHAR(255) NOT NULL,
  password_hash           TEXT,
  password_salt           TEXT,
  password_algo           VARCHAR(20) NOT NULL DEFAULT 'scrypt',
  activation_token_hash   TEXT,
  activation_expires_at   TIMESTAMPTZ,
  is_activated            BOOLEAN NOT NULL DEFAULT false,
  public_partner_id       VARCHAR(30) NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_credentials_email
  ON delivery_partner_credentials(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_delivery_partner_credentials_activation
  ON delivery_partner_credentials(activation_token_hash);

-- 5. Create delivery_partner_password_resets table
CREATE TABLE IF NOT EXISTS delivery_partner_password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_pw_resets_token
  ON delivery_partner_password_resets(token_hash);

-- 6. Extend delivery_assignments with foreign key relationship
ALTER TABLE delivery_assignments
  ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner_id
  ON delivery_assignments(delivery_partner_id);

-- 7. Create delivery_earnings table (Server-authoritative ledger)
CREATE TABLE IF NOT EXISTS delivery_earnings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id                  UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE RESTRICT,
  delivery_id                 UUID NOT NULL REFERENCES delivery_assignments(id) ON DELETE RESTRICT,
  order_id                    TEXT NOT NULL,
  base_earning_paise          INTEGER NOT NULL CHECK (base_earning_paise >= 0),
  extra_items_earning_paise   INTEGER NOT NULL DEFAULT 0 CHECK (extra_items_earning_paise >= 0),
  total_earning_paise         INTEGER NOT NULL CHECK (total_earning_paise >= 0),
  status                      VARCHAR(30) NOT NULL DEFAULT 'available'
                                CHECK (status IN ('pending', 'available', 'paid')),
  payout_id                   UUID,
  metadata                    JSONB DEFAULT '{}'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_earnings_partner
  ON delivery_earnings(partner_id, status);

CREATE INDEX IF NOT EXISTS idx_delivery_earnings_delivery
  ON delivery_earnings(delivery_id);

-- 8. Create delivery_payouts table
CREATE TABLE IF NOT EXISTS delivery_payouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE RESTRICT,
  amount_paise  INTEGER NOT NULL CHECK (amount_paise > 0),
  status        VARCHAR(30) NOT NULL DEFAULT 'paid'
                  CHECK (status IN ('scheduled', 'processing', 'paid', 'failed')),
  period_start  TIMESTAMPTZ,
  period_end    TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_payouts_partner
  ON delivery_payouts(partner_id, status);

-- 9. Automatic updated_at triggers
CREATE OR REPLACE FUNCTION set_delivery_partner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_partner_applications_updated_at ON delivery_partner_applications;
CREATE TRIGGER trg_delivery_partner_applications_updated_at
  BEFORE UPDATE ON delivery_partner_applications
  FOR EACH ROW EXECUTE FUNCTION set_delivery_partner_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_partners_updated_at ON delivery_partners;
CREATE TRIGGER trg_delivery_partners_updated_at
  BEFORE UPDATE ON delivery_partners
  FOR EACH ROW EXECUTE FUNCTION set_delivery_partner_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_earnings_updated_at ON delivery_earnings;
CREATE TRIGGER trg_delivery_earnings_updated_at
  BEFORE UPDATE ON delivery_earnings
  FOR EACH ROW EXECUTE FUNCTION set_delivery_partner_updated_at();

-- 10. Enable Row Level Security (RLS)
ALTER TABLE delivery_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partner_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partner_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_payouts ENABLE ROW LEVEL SECURITY;

-- RLS: Service-role and Admin access policies
CREATE POLICY "delivery_partner_applications: admin manage"
  ON delivery_partner_applications
  FOR ALL
  USING (
    public.get_auth_user_role() IN ('admin', 'super_admin', 'operations')
  );

CREATE POLICY "delivery_partners: read own or admin"
  ON delivery_partners
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.get_auth_user_role() IN ('admin', 'super_admin', 'operations')
  );

CREATE POLICY "delivery_partners: update own on_duty or admin"
  ON delivery_partners
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    public.get_auth_user_role() IN ('admin', 'super_admin', 'operations')
  );

CREATE POLICY "delivery_earnings: read own or admin"
  ON delivery_earnings
  FOR SELECT
  USING (
    partner_id IN (SELECT id FROM delivery_partners WHERE user_id = auth.uid()) OR
    public.get_auth_user_role() IN ('admin', 'super_admin', 'operations')
  );

CREATE POLICY "delivery_payouts: read own or admin"
  ON delivery_payouts
  FOR SELECT
  USING (
    partner_id IN (SELECT id FROM delivery_partners WHERE user_id = auth.uid()) OR
    public.get_auth_user_role() IN ('admin', 'super_admin', 'operations')
  );
