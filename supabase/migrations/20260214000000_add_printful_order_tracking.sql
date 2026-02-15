-- Add Printful order tracking fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS printful_order_id INTEGER,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Index for searching orders by Printful ID
CREATE INDEX IF NOT EXISTS idx_orders_printful_id ON orders(printful_order_id);
