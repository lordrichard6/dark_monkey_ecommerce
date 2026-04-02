-- Store the per-item Printful fulfillment cost (from items[].price in the order API).
-- This is the pure product cost, excluding shipping and VAT.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS printful_item_cost_cents INTEGER;
