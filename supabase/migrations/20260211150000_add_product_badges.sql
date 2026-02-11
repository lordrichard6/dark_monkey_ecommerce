-- Add badge fields to products table for New, Featured, and Sale badges

-- Add is_featured column (admin toggleable)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add is_on_sale column (admin toggleable)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE;

-- Add index for querying featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;

-- Add index for querying products on sale
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale) WHERE is_on_sale = TRUE;

-- Add index for querying new products (created in last 3 days)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

COMMENT ON COLUMN products.is_featured IS 'Manually set by admin - shows Featured badge';
COMMENT ON COLUMN products.is_on_sale IS 'Manually set by admin - shows Sale badge. Note: actual discount is handled via compare_at_price_cents on variants';
