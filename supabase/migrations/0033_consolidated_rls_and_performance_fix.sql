-- ============================================================================
-- FLORIA MASTER MIGRATION 0033: CONSOLIDATED RLS & SECURITY-HARDENED FIX
-- ============================================================================

-- 1. SECURITY DEFINER AUTH HELPERS
-- Explicit search_path = public protects against Search Path Hijacking (CWE-426)
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.user_profiles WHERE id = auth.uid() LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_auth_user_role() IN ('admin', 'super_admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_ops()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_auth_user_role() IN ('admin', 'super_admin', 'operations'));
$$;

CREATE OR REPLACE FUNCTION public.get_auth_seller_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$;

-- ============================================================================
-- 2. USER PROFILES (With Anti-Role-Escalation Trigger)
-- ============================================================================
DROP POLICY IF EXISTS "user_profiles: owner read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: owner update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: admin read all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: admin update all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: insert" ON public.user_profiles;

CREATE POLICY "user_profiles: read" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin_or_ops() OR auth.role() = 'service_role');

CREATE POLICY "user_profiles: update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "user_profiles: insert" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role');

-- Trigger to guarantee non-admins cannot change their own 'role' column via client UPDATE
CREATE OR REPLACE FUNCTION public.guard_user_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can modify account roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_guard_user_role ON public.user_profiles;
CREATE TRIGGER trg_guard_user_role
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_profile_role_update();

-- ============================================================================
-- 3. CATEGORIES
-- ============================================================================
DROP POLICY IF EXISTS "categories: public read active" ON public.categories;
DROP POLICY IF EXISTS "categories: admin all" ON public.categories;
DROP POLICY IF EXISTS "categories: read" ON public.categories;
DROP POLICY IF EXISTS "categories: insert" ON public.categories;
DROP POLICY IF EXISTS "categories: update" ON public.categories;
DROP POLICY IF EXISTS "categories: delete" ON public.categories;

CREATE POLICY "categories: read" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "categories: insert" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "categories: update" ON public.categories
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "categories: delete" ON public.categories
  FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- ============================================================================
-- 4. PRODUCTS & IMAGES
-- ============================================================================
DROP POLICY IF EXISTS "products: public read active" ON public.products;
DROP POLICY IF EXISTS "products: seller read own" ON public.products;
DROP POLICY IF EXISTS "products: seller insert own" ON public.products;
DROP POLICY IF EXISTS "products: seller update own" ON public.products;
DROP POLICY IF EXISTS "products: admin operations read all" ON public.products;
DROP POLICY IF EXISTS "products: read" ON public.products;
DROP POLICY IF EXISTS "products: write" ON public.products;

CREATE POLICY "products: read" ON public.products
  FOR SELECT USING (
    status = 'active' OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "products: write" ON public.products
  FOR ALL USING (
    seller_id = public.get_auth_seller_id() OR
    public.is_admin() OR
    auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "product_images: public read active products" ON public.product_images;
DROP POLICY IF EXISTS "product_images: seller read own" ON public.product_images;
DROP POLICY IF EXISTS "product_images: seller insert own" ON public.product_images;
DROP POLICY IF EXISTS "product_images: seller delete own" ON public.product_images;
DROP POLICY IF EXISTS "product_images: read" ON public.product_images;
DROP POLICY IF EXISTS "product_images: write" ON public.product_images;

CREATE POLICY "product_images: read" ON public.product_images
  FOR SELECT USING (TRUE);

CREATE POLICY "product_images: write" ON public.product_images
  FOR ALL USING (
    product_id IN (SELECT id FROM public.products WHERE seller_id = public.get_auth_seller_id()) OR
    public.is_admin() OR
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 5. INVENTORY
-- ============================================================================
DROP POLICY IF EXISTS "inventory: public read active products" ON public.inventory;
DROP POLICY IF EXISTS "inventory: seller read own" ON public.inventory;
DROP POLICY IF EXISTS "inventory: seller insert own" ON public.inventory;
DROP POLICY IF EXISTS "inventory: seller update own" ON public.inventory;
DROP POLICY IF EXISTS "inventory: read" ON public.inventory;
DROP POLICY IF EXISTS "inventory: write" ON public.inventory;

CREATE POLICY "inventory: read" ON public.inventory
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE status = 'active') OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "inventory: write" ON public.inventory
  FOR ALL USING (
    seller_id = public.get_auth_seller_id() OR
    public.is_admin() OR
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 6. ORDERS & ORDER ITEMS
-- ============================================================================
DROP POLICY IF EXISTS "orders: customer read own" ON public.orders;
DROP POLICY IF EXISTS "orders: seller read own" ON public.orders;
DROP POLICY IF EXISTS "orders: admin operations read all" ON public.orders;
DROP POLICY IF EXISTS "orders: read" ON public.orders;
DROP POLICY IF EXISTS "orders: write" ON public.orders;

CREATE POLICY "orders: read" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid() OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "orders: write" ON public.orders
  FOR ALL USING (public.is_admin_or_ops() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "order_items: customer read own" ON public.order_items;
DROP POLICY IF EXISTS "order_items: seller read own" ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin operations read all" ON public.order_items;
DROP POLICY IF EXISTS "order_items: read" ON public.order_items;
DROP POLICY IF EXISTS "order_items: write" ON public.order_items;

CREATE POLICY "order_items: read" ON public.order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid() OR seller_id = public.get_auth_seller_id()) OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "order_items: write" ON public.order_items
  FOR ALL USING (public.is_admin_or_ops() OR auth.role() = 'service_role');

-- ============================================================================
-- 7. DELIVERY ASSIGNMENTS
-- ============================================================================
DROP POLICY IF EXISTS "delivery_assignments: read" ON public.delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments: write" ON public.delivery_assignments;

CREATE POLICY "delivery_assignments: read" ON public.delivery_assignments
  FOR SELECT USING (
    assigned_to = auth.uid()::text OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "delivery_assignments: write" ON public.delivery_assignments
  FOR ALL USING (
    assigned_to = auth.uid()::text OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 8. NOTIFICATIONS & AUDIT LOGS
-- ============================================================================
DROP POLICY IF EXISTS "notifications: owner select" ON public.notifications;
DROP POLICY IF EXISTS "notifications: owner update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: admin select all" ON public.notifications;
DROP POLICY IF EXISTS "notifications: read" ON public.notifications;
DROP POLICY IF EXISTS "notifications: update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: insert" ON public.notifications;

CREATE POLICY "notifications: read" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "notifications: update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "notifications: insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "audit_records: read" ON public.audit_records;
DROP POLICY IF EXISTS "audit_records: insert" ON public.audit_records;

CREATE POLICY "audit_records: read" ON public.audit_records
  FOR SELECT USING (public.is_admin_or_ops() OR auth.role() = 'service_role');

CREATE POLICY "audit_records: insert" ON public.audit_records
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin_or_ops());

-- ============================================================================
-- 9. MEDIA & UPLOADS
-- ============================================================================
DROP POLICY IF EXISTS "upload_sessions: read" ON public.media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: insert" ON public.media_upload_sessions;
DROP POLICY IF EXISTS "upload_sessions: update" ON public.media_upload_sessions;

CREATE POLICY "upload_sessions: read" ON public.media_upload_sessions
  FOR SELECT USING (
    uploaded_by_user_id = auth.uid() OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "upload_sessions: insert" ON public.media_upload_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "upload_sessions: update" ON public.media_upload_sessions
  FOR UPDATE USING (
    uploaded_by_user_id = auth.uid() OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "media_assets: read" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets: insert" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets: update" ON public.media_assets;

CREATE POLICY "media_assets: read" ON public.media_assets
  FOR SELECT USING (
    storage_bucket = 'public-media' OR
    uploaded_by_user_id = auth.uid() OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "media_assets: insert" ON public.media_assets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "media_assets: update" ON public.media_assets
  FOR UPDATE USING (
    uploaded_by_user_id = auth.uid() OR
    seller_id = public.get_auth_seller_id() OR
    public.is_admin_or_ops() OR
    auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "media_variants: read" ON public.media_variants;
DROP POLICY IF EXISTS "media_variants: insert" ON public.media_variants;
DROP POLICY IF EXISTS "media_variants: update" ON public.media_variants;

CREATE POLICY "media_variants: read" ON public.media_variants FOR SELECT USING (TRUE);
CREATE POLICY "media_variants: insert" ON public.media_variants FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "media_variants: update" ON public.media_variants FOR UPDATE USING (auth.role() = 'service_role' OR public.is_admin());
