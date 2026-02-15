-- Migration: Phase 10 / Phase IV Advanced Features
-- Adds support for recommendations, bundles, and analytics.

-- 1. Product Recommendations & Views
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);

-- Enable RLS on product_views
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own views" ON product_views
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Admins can view all product views" ON product_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    )
  );

-- 2. Product Associations (Frequently Bought Together)
CREATE TABLE IF NOT EXISTS product_associations (
  product_a_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_b_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  last_purchased_together TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_a_id, product_b_id)
);

CREATE INDEX IF NOT EXISTS idx_product_assoc_a ON product_associations(product_a_id);
CREATE INDEX IF NOT EXISTS idx_product_assoc_b ON product_associations(product_b_id);

-- Enable RLS on product_associations
ALTER TABLE product_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product associations" ON product_associations
  FOR SELECT USING (true);

-- 3. Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_pt TEXT,
  description_de TEXT,
  description_fr TEXT,
  description_it TEXT,
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on product_bundles
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active bundles" ON product_bundles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins have full access to bundles" ON product_bundles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    )
  );

-- 4. Bundle Items
CREATE TABLE IF NOT EXISTS bundle_items (
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY (bundle_id, product_id)
);

-- Enable RLS on bundle_items
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view bundle items" ON bundle_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_bundles WHERE id = bundle_id AND is_active = true
    )
  );

-- 5. Upsell Rules
CREATE TABLE IF NOT EXISTS upsell_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- If NULL, applies generally
  upsell_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage INTEGER DEFAULT 0,
  message TEXT,
  message_pt TEXT,
  message_de TEXT,
  message_fr TEXT,
  message_it TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upsell_rules_trigger ON upsell_rules(trigger_product_id);

-- Enable RLS on upsell_rules
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active upsell rules" ON upsell_rules
  FOR SELECT USING (is_active = true);

-- 6. Functions for Analytics & Associations
CREATE OR REPLACE FUNCTION update_product_associations(order_product_ids UUID[])
RETURNS void AS $$
DECLARE
  p1 UUID;
  p2 UUID;
BEGIN
  FOREACH p1 IN ARRAY order_product_ids LOOP
    FOREACH p2 IN ARRAY order_product_ids LOOP
      IF p1 < p2 THEN -- Avoid duplicates and self-pairing
        INSERT INTO product_associations (product_a_id, product_b_id, frequency, last_purchased_together)
        VALUES (p1, p2, 1, NOW())
        ON CONFLICT (product_a_id, product_b_id)
        DO UPDATE SET 
          frequency = product_associations.frequency + 1,
          last_purchased_together = EXCLUDED.last_purchased_together;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
