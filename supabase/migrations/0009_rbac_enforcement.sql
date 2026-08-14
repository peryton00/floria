-- ============================================================
-- Floria — RBAC & RLS Enforcement Migration
-- Migration: 0009_rbac_enforcement.sql
-- ============================================================

-- Ensure Admin & Operations RLS policies on key tables

-- 1. USER PROFILES
CREATE POLICY "user_profiles: admin read all" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operations')
    )
  );

CREATE POLICY "user_profiles: admin update all" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. SELLER PROFILES
CREATE POLICY "seller_profiles: admin operations read all" ON seller_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operations')
    )
  );

CREATE POLICY "seller_profiles: admin update all" ON seller_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operations')
    )
  );

-- 3. PRODUCTS
CREATE POLICY "products: admin operations read all" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operations')
    )
  );

-- 4. ORDERS & ORDER ITEMS
CREATE POLICY "orders: admin operations read all" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operations')
    )
  );

CREATE POLICY "order_items: admin operations read all" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE o.id = order_items.order_id AND up.role IN ('admin', 'operations')
    )
  );

-- 5. SELLER ORDER FULFILLMENTS
CREATE POLICY "seller_order_fulfillments: admin operations read all" ON seller_order_fulfillments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operations')
    )
  );
