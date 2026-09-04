-- ============================================================
-- Floria Migration 0037: Synchronize Email to User Profiles
-- Adds email column to user_profiles, updates handle_new_user()
-- trigger, and backfills all existing user emails from auth.users.
-- ============================================================

-- 1. Add email column to public.user_profiles if not exists
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
  ON public.user_profiles (email);

-- 2. Update trigger function to capture email on signup / OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    role,
    full_name,
    email,
    phone,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'customer'::public.user_role,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(user_profiles.avatar_url, EXCLUDED.avatar_url),
    phone = COALESCE(user_profiles.phone, EXCLUDED.phone),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing user emails from auth.users into user_profiles
UPDATE public.user_profiles up
SET email = u.email,
    phone = COALESCE(up.phone, u.phone, u.raw_user_meta_data->>'phone')
FROM auth.users u
WHERE up.id = u.id
  AND (up.email IS NULL OR up.email = '' OR up.email != u.email);
