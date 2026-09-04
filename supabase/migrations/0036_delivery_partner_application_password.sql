-- ============================================================
-- Floria — Phase P1.5: Delivery Partner Application Password Support
-- Migration: 0036_delivery_partner_application_password.sql
-- ============================================================

-- Add password_hash and password_salt to delivery_partner_applications
ALTER TABLE delivery_partner_applications
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_salt TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
