-- Add tags and product_tags tables
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id);

-- RLS Policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- Public can read tags
CREATE POLICY "Public can read tags" ON tags
  FOR SELECT USING (true);

-- Admin can manage tags
CREATE POLICY "Admin can manage tags" ON tags
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND tier = 'vip' -- Tier 'vip' used for admins in this schema
    )
  );

-- Public can read product associations
CREATE POLICY "Public can read product tags" ON product_tags
  FOR SELECT USING (true);

-- Admin can manage product associations
CREATE POLICY "Admin can manage product tags" ON product_tags
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND tier = 'vip'
    )
  );
