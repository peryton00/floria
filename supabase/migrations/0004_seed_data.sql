-- ============================================================
-- Floria — Production Database Seed Data
-- Migration: 0004_seed_data.sql
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

-- 2. SEED DEMO USERS AND SELLERS
-- Note: Disables FK check temporarily for initial seed if user profile created before auth trigger
ALTER TABLE seller_profiles DISABLE TRIGGER ALL;
ALTER TABLE products DISABLE TRIGGER ALL;

INSERT INTO seller_profiles (id, user_id, business_name, business_description, contact_phone, contact_email, address, logo_url, status, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000101', 'Green Leaf Nursery', 'Premium indoor and outdoor plants curated for urban homes.', '+91 98765 43210', 'greenleaf@floria.in', '12, Nursery Road, Sector 5, Raipur, Chhattisgarh, 492001', 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=300&auto=format&fit=crop&q=80', 'approved', TRUE),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000102', 'Nisarga Gardens', 'Organic potted plants, flowering shrubs, and heritage garden care.', '+91 98765 43211', 'nisarga@floria.in', '88, Garden Street, VIP Road, Raipur, Chhattisgarh, 492006', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300&auto=format&fit=crop&q=80', 'approved', TRUE),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000103', 'Clay & Co.', 'Artisanal handcrafted terracotta planters and ceramic pots.', '+91 98765 43212', 'clayco@floria.in', '45, Potter Lane, Pottery Market, Raipur, Chhattisgarh, 492002', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&auto=format&fit=crop&q=80', 'approved', TRUE),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000104', 'Sai Garden Center', 'Exotic foliage, flowering perennials, and heavy-duty gardening tools.', '+91 98765 43213', 'saigarden@floria.in', '101, Green Highway, Shankar Nagar, Raipur, Chhattisgarh, 492007', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&auto=format&fit=crop&q=80', 'approved', TRUE)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  status = 'approved',
  is_active = TRUE;

-- 3. SEED PRODUCTS
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

-- 4. SEED INVENTORY
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

-- 5. SEED PRODUCT IMAGES
INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?w=600&auto=format&fit=crop&q=80', 'Snake Plant (Sansevieria)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000202', 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80', 'Monstera Deliciosa', 1, TRUE),
  ('00000000-0000-0000-0000-000000000203', 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80', 'Aloe Vera', 1, TRUE),
  ('00000000-0000-0000-0000-000000000204', 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?w=600&auto=format&fit=crop&q=80', 'Peace Lily (Spathiphyllum)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000205', 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=600&auto=format&fit=crop&q=80', 'Sweet Basil Organic Seeds', 1, TRUE),
  ('00000000-0000-0000-0000-000000000206', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80', 'Terracotta Pot (Medium - 8 inch)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000207', 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=80', 'Vibrant Pink Bougainvillea', 1, TRUE),
  ('00000000-0000-0000-0000-000000000208', 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=600&auto=format&fit=crop&q=80', 'Organic Vermicompost (5 kg)', 1, TRUE),
  ('00000000-0000-0000-0000-000000000209', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80', 'Ergonomic Pruning Shears', 1, TRUE),
  ('00000000-0000-0000-0000-000000000210', 'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=600&auto=format&fit=crop&q=80', 'Golden Money Plant (Pothos)', 1, TRUE)
ON CONFLICT DO NOTHING;

ALTER TABLE seller_profiles ENABLE TRIGGER ALL;
ALTER TABLE products ENABLE TRIGGER ALL;
