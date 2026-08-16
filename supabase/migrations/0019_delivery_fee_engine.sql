-- ============================================================================
-- FLORIA MIGRATION 0019: DELIVERY FEE ENGINE & SNAPSHOT ATTRIBUTES
-- ============================================================================

-- 1. SEED DEFAULT DELIVERY SETTINGS IN PLATFORM SETTINGS
INSERT INTO public.platform_settings (key, value, value_type, description, updated_at)
VALUES
  ('delivery_enabled', 'true'::jsonb, 'boolean', 'Master toggle to enable/disable platform delivery fee calculation', NOW()),
  ('base_delivery_fee_paise', '4000'::jsonb, 'number', 'Base delivery fee charged in integer paise (e.g. 4000 = ₹40.00)', NOW()),
  ('free_delivery_enabled', 'true'::jsonb, 'boolean', 'Toggle for automatic free delivery above minimum order threshold', NOW()),
  ('free_delivery_threshold_paise', '99900'::jsonb, 'number', 'Minimum eligible order subtotal in integer paise for free delivery (e.g. 99900 = ₹999.00)', NOW()),
  ('master_order_delivery_mode', '"master_order_single"'::jsonb, 'string', 'Delivery fee mode: single master fee per order', NOW())
ON CONFLICT (key) DO NOTHING;

-- 2. EXTEND ORDERS WITH HISTORICAL DELIVERY SNAPSHOT COLUMNS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee_reason VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_threshold_paise_snapshot BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS eligible_delivery_subtotal_paise BIGINT;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_reason ON public.orders(delivery_fee_reason);
