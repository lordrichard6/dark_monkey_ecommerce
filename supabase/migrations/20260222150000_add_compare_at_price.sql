-- Add compare_at_price_cents to product_variants
-- Used for sale pricing: if compare_at_price_cents > price_cents, the product is on sale.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER;
