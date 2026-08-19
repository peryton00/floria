-- ============================================================
-- Floria — Phase 4.1: Media Infrastructure & Centralized Assets
-- Migration: 0023_media_infrastructure.sql
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE upload_session_status AS ENUM (
    'CREATED',
    'UPLOADING',
    'UPLOADED',
    'COMPLETED',
    'EXPIRED',
    'ABANDONED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_asset_status AS ENUM (
    'RECEIVED',
    'VALIDATING',
    'QUEUED',
    'PROCESSING',
    'STORING',
    'READY',
    'FAILED',
    'RETIRED',
    'DELETING',
    'DELETED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type_category AS ENUM (
    'IMAGE',
    'DOCUMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. TABLE: media_upload_sessions
-- Controls temporary upload sessions for direct-to-staging uploads
-- ============================================================

CREATE TABLE IF NOT EXISTS media_upload_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  target_domain       TEXT NOT NULL, -- e.g. 'PRODUCT', 'NURSERY', 'SELLER_LOGO', 'USER_AVATAR', 'CATEGORY', 'BANNER', 'REVIEW', 'DOCUMENT'
  media_category      media_type_category NOT NULL DEFAULT 'IMAGE',
  original_filename   TEXT NOT NULL,
  expected_mime_type  TEXT NOT NULL,
  expected_size_bytes BIGINT NOT NULL CHECK (expected_size_bytes > 0),
  staging_path        TEXT NOT NULL,
  status              upload_session_status NOT NULL DEFAULT 'CREATED',
  expires_at          TIMESTAMPTZ NOT NULL,
  completed_at        TIMESTAMPTZ,
  failure_stage       TEXT,
  failure_code        TEXT,
  failure_message     TEXT,
  resolved_asset_id   UUID, -- FK added after media_assets table definition
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE media_upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upload_sessions: owner read" ON media_upload_sessions
  FOR SELECT USING (
    auth.uid() = uploaded_by_user_id OR
    (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "upload_sessions: owner insert" ON media_upload_sessions
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by_user_id);

CREATE POLICY "upload_sessions: owner update" ON media_upload_sessions
  FOR UPDATE USING (auth.uid() = uploaded_by_user_id);

-- ============================================================
-- 3. TABLE: media_assets
-- Central metadata registry for all media files owned by Floria
-- ============================================================

CREATE TABLE IF NOT EXISTS media_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID REFERENCES seller_profiles(id) ON DELETE SET NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  session_id          UUID REFERENCES media_upload_sessions(id) ON DELETE SET NULL,
  original_filename   TEXT NOT NULL,
  media_category      media_type_category NOT NULL DEFAULT 'IMAGE',
  mime_type           TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
  sha256_hash         TEXT NOT NULL,
  status              media_asset_status NOT NULL DEFAULT 'RECEIVED',
  failure_stage       TEXT,
  failure_code        TEXT,
  failure_message     TEXT,
  storage_bucket      TEXT NOT NULL, -- Explicit storage bucket ('public-media' or 'private-documents')
  original_path       TEXT,
  is_system_seeded    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Add FK on media_upload_sessions.resolved_asset_id
ALTER TABLE media_upload_sessions
  ADD CONSTRAINT fk_sessions_resolved_asset
  FOREIGN KEY (resolved_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- SELECT ONLY for authenticated clients (Sellers read own assets, Public reads READY public images)
-- INSERT/UPDATE/DELETE strictly blocked for clients; managed exclusively via trusted server/worker service-role
CREATE POLICY "media_assets: owner or public ready image read" ON media_assets
  FOR SELECT USING (
    auth.uid() = uploaded_by_user_id OR
    (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())) OR
    (status = 'READY' AND media_category = 'IMAGE' AND storage_bucket = 'public-media')
  );

-- ============================================================
-- 4. TABLE: media_variants
-- Optimized image variants (WebP) generated by background worker
-- ============================================================

CREATE TABLE IF NOT EXISTS media_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant_name    TEXT NOT NULL, -- 'thumbnail', 'medium', 'large', 'cover', 'standard', 'avatar', 'banner', 'display'
  format          TEXT NOT NULL DEFAULT 'webp', -- V1 generated format
  width           INT NOT NULL CHECK (width > 0),
  height          INT NOT NULL CHECK (height > 0),
  size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0),
  storage_bucket  TEXT NOT NULL DEFAULT 'public-media',
  storage_path    TEXT NOT NULL, -- relative storage path
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_asset_variant UNIQUE (asset_id, variant_name, format)
);

ALTER TABLE media_variants ENABLE ROW LEVEL SECURITY;

-- SELECT ONLY for clients; INSERT/UPDATE/DELETE managed exclusively via trusted server/worker service-role
CREATE POLICY "media_variants: read public or owner" ON media_variants
  FOR SELECT USING (
    storage_bucket = 'public-media' OR
    asset_id IN (
      SELECT id FROM media_assets WHERE
        auth.uid() = uploaded_by_user_id OR
        (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()))
    )
  );

-- ============================================================
-- 5. TABLE: review_media
-- Multi-image attachment support for product reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS review_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  asset_id      UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_review_asset UNIQUE (review_id, asset_id)
);

ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_media: public read approved" ON review_media
  FOR SELECT USING (
    review_id IN (SELECT id FROM product_reviews WHERE status = 'approved')
  );

CREATE POLICY "review_media: customer read own" ON review_media
  FOR SELECT USING (
    review_id IN (SELECT id FROM product_reviews WHERE customer_id = auth.uid())
  );

CREATE POLICY "review_media: customer insert own" ON review_media
  FOR INSERT WITH CHECK (
    review_id IN (SELECT id FROM product_reviews WHERE customer_id = auth.uid())
  );

-- ============================================================
-- 6. ADDITIVE DOMAIN FK INTEGRATIONS (Legacy URLs preserved!)
-- ============================================================

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS logo_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS banner_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

ALTER TABLE seller_documents
  ADD COLUMN IF NOT EXISTS file_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

-- ============================================================
-- 7. INDEXES & SHA-256 DEDUPLICATION CONSTRAINTS
-- ============================================================

-- Enforce SHA-256 Uniqueness for Seller-owned READY Assets
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_assets_seller_sha256
  ON media_assets (seller_id, sha256_hash)
  WHERE status = 'READY' AND is_system_seeded = FALSE AND seller_id IS NOT NULL;

-- Enforce SHA-256 Uniqueness for System-Seeded READY Assets
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_assets_seeded_sha256
  ON media_assets (sha256_hash)
  WHERE status = 'READY' AND is_system_seeded = TRUE;

-- Lookup & Status Indexes
CREATE INDEX IF NOT EXISTS idx_upload_sessions_seller ON media_upload_sessions(seller_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user ON media_upload_sessions(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status_exp ON media_upload_sessions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_media_assets_seller ON media_assets(seller_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_user ON media_assets(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(media_category);

CREATE INDEX IF NOT EXISTS idx_media_variants_asset ON media_variants(asset_id);
CREATE INDEX IF NOT EXISTS idx_review_media_review ON review_media(review_id);
CREATE INDEX IF NOT EXISTS idx_review_media_asset ON review_media(asset_id);

CREATE INDEX IF NOT EXISTS idx_product_images_asset ON product_images(asset_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_logo_asset ON seller_profiles(logo_asset_id);
CREATE INDEX IF NOT EXISTS idx_categories_banner_asset ON categories(banner_asset_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_asset ON user_profiles(avatar_asset_id);
CREATE INDEX IF NOT EXISTS idx_seller_docs_file_asset ON seller_documents(file_asset_id);

-- ============================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_media_upload_sessions_updated_at
  BEFORE UPDATE ON media_upload_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
