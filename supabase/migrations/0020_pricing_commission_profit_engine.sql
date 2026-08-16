-- ============================================================================
-- FLORIA MIGRATION 0020: UNIFIED PRICING, PROFIT, MAINTENANCE & RECOVERY ENGINE
-- ============================================================================

-- 1. SEED DEFAULT PLATFORM FINANCIAL SETTINGS
INSERT INTO public.platform_settings (key, value, value_type, description, updated_at)
VALUES
  ('seller_commission_rate', '12.0'::jsonb, 'number', 'Default seller commission percentage cut from seller base price (e.g. 12.0 = 12%)', NOW()),
  ('floria_profit_rate', '2.0'::jsonb, 'number', 'Internal Floria profit margin percentage added during product pricing (e.g. 2.0 = 2%)', NOW()),
  ('platform_maintenance_fee_paise', '1000'::jsonb, 'number', 'Platform maintenance fee charged once per checkout in integer paise (1000 = ₹10.00)', NOW()),
  ('free_delivery_threshold_paise', '59900'::jsonb, 'number', 'Individual product price threshold in integer paise for free delivery eligibility (59900 = ₹599.00)', NOW()),
  ('free_delivery_recovery_paise', '2000'::jsonb, 'number', 'Hidden delivery recovery amount in integer paise added to eligible products (2000 = ₹20.00)', NOW())
ON CONFLICT (key) DO NOTHING;

-- 2. EXTEND INVENTORY WITH SELLER BASE PRICE AND INTERNAL MARGIN COMPONENTS
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS base_price_paise BIGINT CHECK (base_price_paise >= 0);
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS floria_profit_paise BIGINT DEFAULT 0 CHECK (floria_profit_paise >= 0);
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS delivery_recovery_paise BIGINT DEFAULT 0 CHECK (delivery_recovery_paise >= 0);

-- Backfill base_price_paise for existing inventory rows
UPDATE public.inventory
SET base_price_paise = price_paise
WHERE base_price_paise IS NULL;

-- 3. EXTEND ORDERS TABLE WITH MAINTENANCE FEE SNAPSHOT
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS maintenance_fee_paise BIGINT DEFAULT 0 CHECK (maintenance_fee_paise >= 0);

-- 4. EXTEND ORDER_ITEMS WITH PRODUCT FINANCIAL ATTRIBUTION SNAPSHOTS
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS base_price_paise_snapshot BIGINT CHECK (base_price_paise_snapshot >= 0);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS floria_profit_rate_snapshot NUMERIC(5, 4);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS floria_profit_paise_snapshot BIGINT CHECK (floria_profit_paise_snapshot >= 0);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS delivery_recovery_paise_snapshot BIGINT CHECK (delivery_recovery_paise_snapshot >= 0);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customer_price_paise_snapshot BIGINT CHECK (customer_price_paise_snapshot >= 0);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_free_delivery_eligible_snapshot BOOLEAN DEFAULT FALSE;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS commission_rate_snapshot NUMERIC(5, 4);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS commission_paise_snapshot BIGINT CHECK (commission_paise_snapshot >= 0);
