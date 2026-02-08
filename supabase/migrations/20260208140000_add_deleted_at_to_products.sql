-- Add deleted_at column to products table
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;

-- Index for performance
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
