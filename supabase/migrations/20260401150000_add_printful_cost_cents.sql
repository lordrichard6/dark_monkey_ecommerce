-- Store Printful production cost directly on the order so we never need to
-- call the Printful API on every accounting page load.
-- Once fulfilled, production costs are immutable — safe to cache forever.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_cost_cents INTEGER;
