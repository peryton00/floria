-- Allow initial seed insert for categories, seller_profiles, products, inventory, product_images
CREATE POLICY "categories: seed insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles: seed insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "seller_profiles: seed insert" ON seller_profiles FOR INSERT WITH CHECK (true);
