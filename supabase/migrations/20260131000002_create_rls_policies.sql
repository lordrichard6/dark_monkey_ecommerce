-- RLS policies for Ecommerce Premium
-- Public read for products; user-scoped for orders, addresses, profiles

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlist ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Products: public read (active only for storefront; admin will bypass)
CREATE POLICY "Active products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Product variants: public read
CREATE POLICY "Product variants are viewable by everyone" ON product_variants
  FOR SELECT USING (true);

-- Product images: public read
CREATE POLICY "Product images are viewable by everyone" ON product_images
  FOR SELECT USING (true);

-- Product inventory: public read (for stock display)
CREATE POLICY "Product inventory is viewable by everyone" ON product_inventory
  FOR SELECT USING (true);

-- Customization rules: public read
CREATE POLICY "Customization rules are viewable by everyone" ON customization_rules
  FOR SELECT USING (true);

-- Discounts: public read (valid codes only - app layer can filter)
CREATE POLICY "Discounts are viewable by everyone" ON discounts
  FOR SELECT USING (true);

-- User profiles: users can read/update own
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Addresses: users can CRUD own
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Orders: users can view own; guests have no direct access (order confirmation via email link with token - future)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Order items: via orders (user can only see items of own orders)
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- User XP events: users can read own
CREATE POLICY "Users can view own xp events" ON user_xp_events
  FOR SELECT USING (auth.uid() = user_id);

-- User wishlist: users can CRUD own
CREATE POLICY "Users can view own wishlist" ON user_wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON user_wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON user_wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Service role will handle: order creation (webhook), user_profile insert on signup, user_xp_events insert
-- Admin panel will use service role or separate admin policies (Phase 6)
