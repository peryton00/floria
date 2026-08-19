-- ============================================================
-- Floria — Phase 4.2: Supabase Storage Buckets & Security Policies
-- Migration: 0024_storage_buckets_and_policies.sql
-- ============================================================

-- ============================================================
-- 1. PROVISION STORAGE BUCKETS IN storage.buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'media-staging',
    'media-staging',
    FALSE, -- Private temporary upload bucket
    10485760, -- 10 MB max raw upload limit (Aligned with 10MB defense-in-depth ceiling)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'application/pdf']
  ),
  (
    'public-media',
    'public-media',
    TRUE, -- Public CDN distribution bucket for processed WebP variants
    10485760, -- 10 MB max variant size
    ARRAY['image/webp', 'image/avif', 'image/jpeg', 'image/png', 'image/svg+xml']
  ),
  (
    'private-documents',
    'private-documents',
    FALSE, -- Private bucket for seller verification & GSTIN documents
    10485760, -- 10 MB max document size
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. STORAGE OBJECT POLICIES (storage.objects)
-- ============================================================

-- BUCKET 1: media-staging (Private temporary staging)
-- Strict upload session correlation: Upload allowed ONLY if path matches an active, unexpired media_upload_sessions record owned by user/seller
CREATE POLICY "staging: upload session owner insert staging object" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-staging' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM media_upload_sessions s
      WHERE s.id::text = (storage.foldername(name))[3]
        AND (
          s.uploaded_by_user_id = auth.uid() OR
          (s.seller_id IS NOT NULL AND s.seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()))
        )
        AND s.status IN ('CREATED', 'UPLOADING')
        AND s.expires_at > now()
        AND (
          (s.seller_id IS NOT NULL AND (storage.foldername(name))[2] = s.seller_id::text) OR
          (s.seller_id IS NULL AND (storage.foldername(name))[2] = s.uploaded_by_user_id::text)
        )
    )
  );

-- BUCKET 2: public-media (Public CDN distribution)
-- Public SELECT allowed for all CDN consumers.
-- ZERO client INSERT, UPDATE, or DELETE permissions! Only trusted service_role can write processed variants.
CREATE POLICY "public_media: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-media');

-- BUCKET 3: private-documents (Private restricted seller documents)
-- No public SELECT. Sellers read their own documents; Admins/Operations read all.
CREATE POLICY "private_docs: owner or admin read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private-documents' AND
    auth.role() = 'authenticated' AND
    (
      (storage.foldername(name))[2] IN (
        SELECT id::text FROM seller_profiles WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND role IN ('admin', 'super_admin', 'operations')
      )
    )
  );

-- ============================================================
-- 3. TIGHTEN media_variants DATABASE RLS SECURITY RULE
-- Ensures non-READY or DOCUMENT variants are NEVER publicly discoverable via RLS
-- ============================================================

DROP POLICY IF EXISTS "media_variants: read public or owner" ON media_variants;
DROP POLICY IF EXISTS "media_variants: read ready public image or owner" ON media_variants;

CREATE POLICY "media_variants: read ready public image or owner" ON media_variants
  FOR SELECT USING (
    (
      storage_bucket = 'public-media' AND
      EXISTS (
        SELECT 1 FROM media_assets
        WHERE media_assets.id = media_variants.asset_id
          AND media_assets.status = 'READY'
          AND media_assets.media_category = 'IMAGE'
          AND media_assets.storage_bucket = 'public-media'
      )
    ) OR
    EXISTS (
      SELECT 1 FROM media_assets
      WHERE media_assets.id = media_variants.asset_id
        AND (
          auth.uid() = media_assets.uploaded_by_user_id OR
          (media_assets.seller_id IS NOT NULL AND media_assets.seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()))
        )
    )
  );
