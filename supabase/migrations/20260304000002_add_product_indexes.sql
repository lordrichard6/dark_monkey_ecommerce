-- Performance indexes for high-traffic storefront queries
-- Products listing: filter by is_active + deleted_at (used on every page load)
CREATE INDEX IF NOT EXISTS idx_products_active
  ON products (is_active, deleted_at)
  WHERE is_active = true AND deleted_at IS NULL;

-- Products by category (used on category pages)
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON products (category_id, is_active, deleted_at)
  WHERE is_active = true AND deleted_at IS NULL;

-- Orders by user (used on account/orders page)
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Orders by status (used in admin order management)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (status, created_at DESC);

-- Product variants by product (used on product detail page)
CREATE INDEX IF NOT EXISTS idx_product_variants_product
  ON product_variants (product_id);

-- Wishlist by user (used on account/wishlist page)
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user
  ON user_wishlist (user_id, created_at DESC);

-- Abandoned checkouts by session (used in webhook handler)
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_session
  ON abandoned_checkouts (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
