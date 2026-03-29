-- Add is_featured flag to products (same pattern as categories)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast landing-page query
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured) WHERE is_featured = TRUE;
