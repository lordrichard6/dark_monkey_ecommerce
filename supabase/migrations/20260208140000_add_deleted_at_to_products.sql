-- Add deleted_at column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
