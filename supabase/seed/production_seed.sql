-- ============================================================
-- Floria — Complete Production Database Seed Script
-- File: supabase/seed/production_seed.sql
-- ============================================================

-- 1. SEED CATEGORIES
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = TRUE;

-- 2. SEED AUTH USERS & USER PROFILES
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000000', 'greenleaf@floria.in', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000000', 'nisarga@floria.in',  '$2a$10$abcdefghijklmnopqrstuvwxyz012345', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000000', 'clayco@floria.in',   '$2a$10$abcdefghijklmnopqrstuvwxyz012345', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000000', 'saigarden@floria.in', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', now(), 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, full_name, phone, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'seller', 'Green Leaf Nursery', '+91 98765 43210', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/96fa064a-30d7-4652-bf01-962bf534fadd/medium.webp'),
  ('00000000-0000-0000-0000-000000000102', 'seller', 'Nisarga Gardens',    '+91 98765 43211', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/9d707107-77fe-4ebb-8fa4-c39984f3893b/medium.webp'),
  ('00000000-0000-0000-0000-000000000103', 'seller', 'Clay & Co.',         '+91 98765 43212', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/a4d3e43f-1b50-4fc7-94f0-6400451816b9/medium.webp'),
  ('00000000-0000-0000-0000-000000000104', 'seller', 'Sai Garden Center',  '+91 98765 43213', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/77a8be13-cb44-47e0-a1e2-227917e88b15/medium.webp')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED SELLER PROFILES
INSERT INTO seller_profiles (id, user_id, business_name, business_description, contact_phone, contact_email, address, logo_url, status, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000101', 'Green Leaf Nursery', 'Premium indoor and outdoor plants curated for urban homes. We specialize in low-maintenance tropicals and succulents.', '+91 98765 43210', 'greenleaf@floria.in', '12, Nursery Road, Sector 5, Raipur, Chhattisgarh, 492001', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/96fa064a-30d7-4652-bf01-962bf534fadd/medium.webp', 'approved', TRUE),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000102', 'Nisarga Gardens', 'Organic potted plants, flowering shrubs, and heritage garden care essentials.', '+91 98765 43211', 'nisarga@floria.in', '88, Garden Street, VIP Road, Raipur, Chhattisgarh, 492006', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/9d707107-77fe-4ebb-8fa4-c39984f3893b/medium.webp', 'approved', TRUE),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000103', 'Clay & Co.', 'Artisanal handcrafted terracotta planters, ceramic pots, and drainage solutions.', '+91 98765 43212', 'clayco@floria.in', '45, Potter Lane, Pottery Market, Raipur, Chhattisgarh, 492002', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/a4d3e43f-1b50-4fc7-94f0-6400451816b9/medium.webp', 'approved', TRUE),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000104', 'Sai Garden Center', 'Exotic indoor foliage, flowering perennials, and heavy-duty gardening tools.', '+91 98765 43213', 'saigarden@floria.in', '101, Green Highway, Shankar Nagar, Raipur, Chhattisgarh, 492007', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/77a8be13-cb44-47e0-a1e2-227917e88b15/medium.webp', 'approved', TRUE)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  status = 'approved',
  is_active = TRUE;

-- 4. SEED PRODUCTS
INSERT INTO products (id, seller_id, category_id, name, slug, description, care_instructions, status)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Snake Plant (Sansevieria)', 'snake-plant', 'Air-purifying indoor plant that thrives on low light and infrequent watering. Ideal for bedrooms and offices.', 'Water every 2-3 weeks. Keep in indirect sunlight.', 'active'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Monstera Deliciosa', 'monstera-deliciosa', 'Iconic Swiss cheese plant with large glossy split leaves. Brings a tropical jungle vibe to living rooms.', 'Bright indirect light. Water when top 2 inches of soil feel dry.', 'active'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 'Aloe Vera', 'aloe-vera', 'Healing medicinal succulent known for its soothing gel leaves. Requires minimal maintenance.', 'Full sun or bright light. Water sparingly.', 'active'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Peace Lily (Spathiphyllum)', 'peace-lily', 'Elegant white flowering indoor plant that filters air pollutants and indicates when it needs water.', 'Low to medium indirect light. Keep soil moist.', 'active'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000005', 'Sweet Basil Organic Seeds', 'sweet-basil-seeds', 'Non-GMO organic culinary basil seeds. Grows aromatic, lush leaves perfect for fresh pesto and Italian dishes.', 'Sow 1/4 inch deep in well-drained fertile soil. Full sun.', 'active'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000006', 'Terracotta Pot (Medium - 8 inch)', 'terracotta-pot-medium', 'Handcrafted breathable clay pot with matching saucer. Ensures optimal root aeration for healthy plant growth.', 'Wipe with damp cloth. Suitable for indoor and outdoor plants.', 'active'),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000004', 'Vibrant Pink Bougainvillea', 'pink-bougainvillea', 'Sun-loving tropical climber bursting with magenta blossoms. Drought resistant once established.', 'Direct full sunlight. Water when soil dries out.', 'active'),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000007', 'Organic Vermicompost (5 kg)', 'organic-vermicompost-5kg', '100% pure organic bio-fertilizer enriched with soil microbes for vibrant plant growth.', 'Mix 1-2 cups into topsoil every 30 days.', 'active'),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000008', 'Ergonomic Pruning Shears', 'ergonomic-pruning-shears', 'Precision Japanese steel bypass pruner with non-slip handles for clean stem cuts.', 'Clean blades after use and apply light mineral oil.', 'active'),
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Golden Money Plant (Pothos)', 'golden-money-plant', 'Classic trailing vine with heart-shaped variegated leaves. Brings prosperity and positive energy.', 'Low to bright light. Water weekly.', 'active')
ON CONFLICT (slug) DO UPDATE SET
  status = 'active';

-- 5. SEED INVENTORY
INSERT INTO inventory (product_id, seller_id, price_paise, stock_quantity, low_stock_threshold, sku)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 29900, 24, 5, 'SKU-SNAKEPLANT'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 49900, 15, 5, 'SKU-MONSTERADELICIOSA'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 19900, 30, 5, 'SKU-ALOEVERA'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000102', 34900, 18, 5, 'SKU-PEACELILY'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000102',  9900, 50, 5, 'SKU-SWEETBASILSEEDS'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000103', 14900, 40, 5, 'SKU-TERRACOTTAPOTMEDIUM'),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000102', 27900, 12, 5, 'SKU-PINKBOUGAINVILLEA'),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000104', 24900, 35, 5, 'SKU-ORGANICVERMICOMPOST5KG'),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000104', 39900, 20, 5, 'SKU-ERGONOMICPRUNINGSHEARS'),
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000101', 17900, 45, 5, 'SKU-GOLDENMONEYPLANT')
ON CONFLICT (product_id) DO UPDATE SET
  price_paise = EXCLUDED.price_paise,
  stock_quantity = EXCLUDED.stock_quantity;

-- 6. SEED PRODUCT IMAGES
INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/a996836e-1bf1-4805-8a63-32339503a310/medium.webp', 'Snake Plant (Sansevieria)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000202', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/a996836e-1bf1-4805-8a63-32339503a310/medium.webp', 'Monstera Deliciosa', 1, TRUE),
  ('00000000-0000-0000-0000-000000000203', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/d0bba723-132b-4b2e-abc2-286e08ec4637/medium.webp', 'Aloe Vera', 1, TRUE),
  ('00000000-0000-0000-0000-000000000204', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/ec1dc2bd-402f-481a-9170-329d552eefcf/medium.webp', 'Peace Lily (Spathiphyllum)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000205', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/a394425e-1bec-4d14-a36a-550648ba4762/medium.webp', 'Sweet Basil Organic Seeds', 1, TRUE),
  ('00000000-0000-0000-0000-000000000206', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/a4d3e43f-1b50-4fc7-94f0-6400451816b9/medium.webp', 'Terracotta Pot (Medium - 8 inch)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000207', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/b5ff0d43-d559-466c-bee2-3ade79a582a7/standard.webp', 'Vibrant Pink Bougainvillea', 1, TRUE),
  ('00000000-0000-0000-0000-000000000208', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/832d746c-a5ed-4e88-ad9b-796c613614c5/standard.webp', 'Organic Vermicompost (5 kg)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000209', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/77a8be13-cb44-47e0-a1e2-227917e88b15/medium.webp', 'Ergonomic Pruning Shears', 1, TRUE),
  ('00000000-0000-0000-0000-000000000210', 'https://flymwzdtsrkiiriqaswc.supabase.co/storage/v1/object/public/public-media/system/4c4784da-f022-47c0-9cea-7715dc0a7852/standard.webp', 'Golden Money Plant (Pothos)', 1, TRUE)
ON CONFLICT DO NOTHING;
