-- Migration 0022: Nursery Profile Onboarding & Extended Profile Attributes
-- Adds structured onboarding attributes to seller_profiles table

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'nursery',
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS year_established INT,
  ADD COLUMN IF NOT EXISTS primary_contact_person TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_available BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS nursery_category TEXT,
  ADD COLUMN IF NOT EXISTS plant_categories JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS nursery_size TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS detailed_description TEXT,
  ADD COLUMN IF NOT EXISTS seasonal_availability TEXT,
  ADD COLUMN IF NOT EXISTS bulk_orders_supported BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_requirements_supported BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS landscaping_services BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gardening_services BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;


-- Backfill existing active/approved seller profiles as completed so existing accounts are not disrupted
UPDATE seller_profiles
SET is_profile_completed = TRUE,
    onboarding_step = 5,
    business_type = COALESCE(business_type, 'nursery'),
    owner_name = COALESCE(owner_name, business_name),
    primary_contact_person = COALESCE(primary_contact_person, business_name),
    profile_completed_at = COALESCE(profile_completed_at, updated_at)
WHERE (status = 'approved' OR is_active = TRUE)
  AND (is_profile_completed IS NULL OR is_profile_completed = FALSE);

-- Index for onboarding and profile status
CREATE INDEX IF NOT EXISTS idx_seller_profiles_completion ON seller_profiles(is_profile_completed, status);
