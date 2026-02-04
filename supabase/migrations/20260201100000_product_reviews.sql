-- Product reviews: one per user per product, optional link to order (verified purchase)
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_created ON product_reviews(created_at DESC);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Product reviews are viewable by everyone" ON product_reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own review (user_id must match)
CREATE POLICY "Users can insert own review" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete only their own review
CREATE POLICY "Users can update own review" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own review" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);
