-- Printful integration: variant mapping + order tracking
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS printful_variant_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_order_id BIGINT;

COMMENT ON COLUMN product_variants.printful_variant_id IS 'Printful Catalog variant ID for fulfillment';
COMMENT ON COLUMN orders.printful_order_id IS 'Printful order ID after fulfillment submitted';
