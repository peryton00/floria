-- ============================================================
-- Floria Migration 0012: Automatic User Profile Creation Trigger & Backfill
-- Ensures every auth.users entry (Email & Google OAuth) has a corresponding
-- row in public.user_profiles.
-- ============================================================

-- Function to handle auto-creation of user_profiles from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    role,
    full_name,
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
    NEW.raw_user_meta_data->>'phone',
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(user_profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill all existing auth.users entries into user_profiles
INSERT INTO public.user_profiles (
  id,
  role,
  full_name,
  phone,
  avatar_url,
  created_at,
  updated_at
)
SELECT
  id,
  'customer'::public.user_role,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'display_name',
    split_part(email, '@', 1)
  ),
  raw_user_meta_data->>'phone',
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  ),
  COALESCE(created_at, now()),
  now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;
