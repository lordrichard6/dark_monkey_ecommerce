-- One-time surcharge: add CHF 3 (300 cents) to all 2XL, 3XL, 4XL, 5XL variants
-- Only affects variants with price already set (price_cents > 0)
UPDATE product_variants
SET price_cents = price_cents + 300
WHERE (attributes->>'size') ILIKE ANY(ARRAY['2xl', '3xl', '4xl', '5xl'])
AND price_cents > 0;
