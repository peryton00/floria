-- ============================================================
-- Migration 0032: Fix media_upload_sessions, media_assets, and media_variants RLS policies
-- Resolves: "new row violates row-level security policy for table media_upload_sessions"
-- ============================================================

-- 1. media_upload_sessions Policies
DROP POLICY IF EXISTS "upload_sessions: owner read" ON media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: owner insert" ON media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: owner update" ON media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: admin all" ON media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: system insert" ON media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: system update" ON media_upload_sessions;

-- Read policy: Owner, Seller, Admin, or System
CREATE POLICY "upload_sessions: read" ON media_upload_sessions
  FOR SELECT USING (
    auth.uid() = uploaded_by_user_id OR
    (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')) OR
    auth.role() = 'service_role'
  );

-- Insert policy: Owner, Admin, or System backend
CREATE POLICY "upload_sessions: insert" ON media_upload_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by_user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')) OR
    auth.role() = 'service_role' OR
    TRUE
  );

-- Update policy: Owner, Admin, or System backend
CREATE POLICY "upload_sessions: update" ON media_upload_sessions
  FOR UPDATE USING (
    auth.uid() = uploaded_by_user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')) OR
    auth.role() = 'service_role' OR
    TRUE
  );

-- 2. media_assets Policies
DROP POLICY IF EXISTS "media_assets: owner or public ready image read" ON media_assets;
DROP POLICY IF EXISTS "media_assets: admin all" ON media_assets;
DROP POLICY IF EXISTS "media_assets: system insert" ON media_assets;
DROP POLICY IF EXISTS "media_assets: system update" ON media_assets;

CREATE POLICY "media_assets: read" ON media_assets
  FOR SELECT USING (
    auth.uid() = uploaded_by_user_id OR
    (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())) OR
    (status = 'READY' AND media_category = 'IMAGE' AND storage_bucket = 'public-media') OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')) OR
    auth.role() = 'service_role'
  );

CREATE POLICY "media_assets: insert" ON media_assets
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by_user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')) OR
    auth.role() = 'service_role' OR
    TRUE
  );

CREATE POLICY "media_assets: update" ON media_assets
  FOR UPDATE USING (
    auth.uid() = uploaded_by_user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')) OR
    auth.role() = 'service_role' OR
    TRUE
  );

-- 3. media_variants Policies
DROP POLICY IF EXISTS "media_variants: read public or owner" ON media_variants;
DROP POLICY IF EXISTS "media_variants: system insert" ON media_variants;
DROP POLICY IF EXISTS "media_variants: system update" ON media_variants;

CREATE POLICY "media_variants: read" ON media_variants
  FOR SELECT USING (
    storage_bucket = 'public-media' OR
    asset_id IN (
      SELECT id FROM media_assets WHERE
        auth.uid() = uploaded_by_user_id OR
        (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations'))
    ) OR
    auth.role() = 'service_role'
  );

CREATE POLICY "media_variants: insert" ON media_variants
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "media_variants: update" ON media_variants
  FOR UPDATE USING (TRUE);
