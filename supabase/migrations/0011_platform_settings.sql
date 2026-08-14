-- ============================================================
-- Floria — Platform Settings Migration
-- Migration: 0011_platform_settings.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'number',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES user_profiles(id)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "platform_settings: admin read" ON platform_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin write policy
CREATE POLICY "platform_settings: admin write" ON platform_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed initial setting for platform_commission_rate (12.0%)
INSERT INTO platform_settings (key, value, value_type, description)
VALUES (
  'platform_commission_rate',
  '12.0'::jsonb,
  'number',
  'Platform commission rate percentage applied server-side to order subtotals (e.g. 12.0 = 12.0%)'
)
ON CONFLICT (key) DO NOTHING;
