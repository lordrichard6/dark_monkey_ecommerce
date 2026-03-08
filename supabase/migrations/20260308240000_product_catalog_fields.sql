-- Additional product fields populated from Printful catalog API during sync
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS origin_country TEXT,
  ADD COLUMN IF NOT EXISTS avg_fulfillment_time TEXT;
