-- ============================================================
-- Floria — Fix user_profiles RLS Infinite Recursion
-- Migration: 0014_fix_user_profiles_recursion.sql
-- ============================================================

-- 1. Create a security definer function to read the user's role.
-- SECURITY DEFINER runs the query with the privileges of the database owner,
-- which bypasses RLS and prevents the compiler from recursing infinitely.
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles WHERE id = auth.uid()
  );
END;
$$;

-- 2. Drop the old recursive policies on user_profiles
DROP POLICY IF EXISTS "user_profiles: admin read all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: admin update all" ON public.user_profiles;

-- 3. Re-create the policies using the get_auth_user_role() helper
CREATE POLICY "user_profiles: admin read all" ON public.user_profiles
  FOR SELECT USING (
    public.get_auth_user_role() IN ('admin', 'operations')
  );

CREATE POLICY "user_profiles: admin update all" ON public.user_profiles
  FOR UPDATE USING (
    public.get_auth_user_role() = 'admin'
  );
