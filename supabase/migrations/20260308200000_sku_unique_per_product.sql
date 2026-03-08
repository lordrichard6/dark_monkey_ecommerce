-- Change SKU uniqueness from global to per-product.
-- A global unique constraint means two Printful products with variants sharing
-- the same SKU (e.g. after a delete + re-sync) would fail with a duplicate key error.
-- Per-product uniqueness is the correct semantic: SKUs only need to be unique
-- within a single product's variants.

ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_per_product
  ON product_variants (product_id, sku)
  WHERE sku IS NOT NULL;
