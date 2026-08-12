-- ============================================================
-- Floria — Development Demo Seed
-- supabase/seed/demo_seed.sql
-- ============================================================
-- Run ONLY in development / demo environments.
-- Do NOT run in production.
-- ============================================================

-- Demo categories
INSERT INTO categories (id, name, slug, description, display_order, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Indoor Plants',       'indoor-plants',       'Plants that thrive indoors',          1, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Outdoor Plants',      'outdoor-plants',      'Plants for gardens and balconies',    2, TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Succulents & Cacti',  'succulents-cacti',    'Low-maintenance desert plants',       3, TRUE),
  ('00000000-0000-0000-0000-000000000004', 'Flowering Plants',    'flowering-plants',    'Seasonal and perennial flowers',      4, TRUE),
  ('00000000-0000-0000-0000-000000000005', 'Herbs & Edibles',     'herbs-edibles',       'Grow your own herbs and vegetables',  5, TRUE),
  ('00000000-0000-0000-0000-000000000006', 'Planters & Pots',     'planters-pots',       'Decorative and functional planters',  6, TRUE),
  ('00000000-0000-0000-0000-000000000007', 'Soil & Fertilizers',  'soil-fertilizers',    'Premium growing media and nutrition', 7, TRUE),
  ('00000000-0000-0000-0000-000000000008', 'Tools & Accessories', 'tools-accessories',   'Gardening tools and care accessories',8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Note: demo nursery account and products are created via Supabase Auth + seller onboarding
-- to preserve the auth.users FK relationship. Seed those via the app or Supabase dashboard.
