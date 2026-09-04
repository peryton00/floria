-- ============================================================
-- Floria — Phase P1: Delivery Partner Push Notifications & Dynamic Rate Card
-- Migration: 0035_delivery_partner_p1_notifications_ratecard.sql
-- ============================================================

-- 1. Create device_tokens table for push notification dispatch
CREATE TABLE IF NOT EXISTS device_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  partner_id      UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
  token           TEXT NOT NULL,
  platform        VARCHAR(20) NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  device_info     JSONB DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_device_tokens_user_token UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id
  ON device_tokens(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_device_tokens_partner_id
  ON device_tokens(partner_id, is_active);

CREATE INDEX IF NOT EXISTS idx_device_tokens_token
  ON device_tokens(token);

-- 2. Create delivery_rate_cards table for dynamic courier compensation
CREATE TABLE IF NOT EXISTS delivery_rate_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(100) NOT NULL,
  base_earning_paise  INTEGER NOT NULL CHECK (base_earning_paise >= 0),
  currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
  effective_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to        TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('draft', 'active', 'inactive', 'superseded')),
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_by          UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_rate_cards_status_dates
  ON delivery_rate_cards(status, effective_from DESC);

-- 3. Seed canonical baseline rate card (₹80.00 base pay)
INSERT INTO delivery_rate_cards (
  id,
  name,
  base_earning_paise,
  currency,
  effective_from,
  effective_to,
  status,
  metadata
)
VALUES (
  '00000000-0000-0000-0000-000000000080',
  'Standard Bangalore Metro Delivery Rate Card',
  8000,
  'INR',
  '2026-01-01 00:00:00+00',
  NULL,
  'active',
  '{"version": 1, "description": "Standard base delivery payout of ₹80 per completed order with verified POD"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_rate_cards ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for device_tokens
CREATE POLICY device_tokens_user_select
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY device_tokens_user_insert
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY device_tokens_user_update
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY device_tokens_user_delete
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY device_tokens_service_role
  ON device_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. RLS Policies for delivery_rate_cards (Couriers can view, Admin can manage)
CREATE POLICY rate_cards_read_all
  ON delivery_rate_cards FOR SELECT
  USING (true);

CREATE POLICY rate_cards_service_role
  ON delivery_rate_cards FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
