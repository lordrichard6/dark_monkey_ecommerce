-- Refine size surcharges to reflect actual Printful per-step cost increases.
-- 2XL already has +CHF 3 applied. This migration adds the remaining delta:
--   3XL → +CHF 2 more (total +CHF 5 over base)
--   4XL → +CHF 4 more (total +CHF 7 over base)
--   5XL → +CHF 6 more (total +CHF 9 over base)

UPDATE product_variants
SET price_cents = price_cents + 200
WHERE (attributes->>'size') ILIKE '3xl'
AND price_cents > 0;

UPDATE product_variants
SET price_cents = price_cents + 400
WHERE (attributes->>'size') ILIKE '4xl'
AND price_cents > 0;

UPDATE product_variants
SET price_cents = price_cents + 600
WHERE (attributes->>'size') ILIKE '5xl'
AND price_cents > 0;
