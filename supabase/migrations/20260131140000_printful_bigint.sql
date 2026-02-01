-- Printful sync IDs can exceed INTEGER max (2^31-1). Use BIGINT.
DROP INDEX IF EXISTS idx_products_printful_sync_product_id;
DROP INDEX IF EXISTS idx_product_variants_printful_sync_variant_id;

ALTER TABLE products ALTER COLUMN printful_sync_product_id TYPE BIGINT;
ALTER TABLE product_variants ALTER COLUMN printful_sync_variant_id TYPE BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_printful_sync_product_id
  ON products (printful_sync_product_id) WHERE printful_sync_product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_printful_sync_variant_id
  ON product_variants (printful_sync_variant_id) WHERE printful_sync_variant_id IS NOT NULL;
