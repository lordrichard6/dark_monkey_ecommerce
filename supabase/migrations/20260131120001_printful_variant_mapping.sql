-- Printful variant mapping (from Printful Catalog API)
-- Bella+Canvas 3001 product 71: 4017=Black/M, 4018=Black/L, 5309=White/4XL (use 4016 White/S or similar)
-- Use execution/printful_fetch_catalog.py to discover and update mappings
-- Verified: 4017 (Black M), 4018 (Black L) from product 71

UPDATE product_variants SET printful_variant_id = 4017 WHERE id = '33333333-3333-3333-3333-333333333303'; -- Classic Tee White M (use Black M as fallback - update in Printful dashboard)
UPDATE product_variants SET printful_variant_id = 4018 WHERE id = '33333333-3333-3333-3333-333333333304'; -- Classic Tee Black L
