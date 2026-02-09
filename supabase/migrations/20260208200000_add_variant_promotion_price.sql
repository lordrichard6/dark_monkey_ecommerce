-- Add compare_at_price_cents to product_variants for promotions
ALTER TABLE product_variants ADD COLUMN compare_at_price_cents INTEGER;
