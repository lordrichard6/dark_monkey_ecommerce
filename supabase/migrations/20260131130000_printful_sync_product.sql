-- Track Printful sync product/variant for products synced from Printful store
ALTER TABLE products ADD COLUMN IF NOT EXISTS printful_sync_product_id INTEGER;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS printful_sync_variant_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_printful_sync_product_id
  ON products (printful_sync_product_id) WHERE printful_sync_product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_printful_sync_variant_id
  ON product_variants (printful_sync_variant_id) WHERE printful_sync_variant_id IS NOT NULL;

COMMENT ON COLUMN products.printful_sync_product_id IS 'Printful store sync product ID (for products synced from Printful)';
COMMENT ON COLUMN product_variants.printful_sync_variant_id IS 'Printful store sync variant ID (use sync_variant_id when creating orders)';
