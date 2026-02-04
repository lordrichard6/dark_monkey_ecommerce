-- Add discount reference and amount to orders (for checkout-applied discounts)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN orders.discount_id IS 'Discount applied at checkout, if any';
COMMENT ON COLUMN orders.discount_cents IS 'Discount amount in cents (saved for record)';
