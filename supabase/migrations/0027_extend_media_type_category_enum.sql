-- ============================================================
-- Floria — Migration 0027: Extend media_type_category ENUM
-- Allows storing granular media categories in media_assets
-- ============================================================

DO $$ BEGIN
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'PRODUCT';
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'CATEGORY';
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'NURSERY';
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'SELLER_LOGO';
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'USER_AVATAR';
  ALTER TYPE media_type_category ADD VALUE IF NOT EXISTS 'REVIEW_IMAGE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
