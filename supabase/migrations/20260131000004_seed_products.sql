-- Seed 12 default products: 4 clothing, 4 personalized cups, 4 customized hats
-- Uses placeholder images (picsum.photos)

-- Categories
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Apparel', 'apparel', 'Clothing and accessories', 1),
  ('11111111-1111-1111-1111-111111111102', 'Personalized Cups', 'personalized-cups', 'Custom mugs and tumblers', 2),
  ('11111111-1111-1111-1111-111111111103', 'Customized Hats', 'customized-hats', 'Hats with your logo', 3);

-- 4 Clothing products
INSERT INTO products (id, category_id, name, slug, description, is_customizable, is_active) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Premium Hoodie', 'premium-hoodie', 'Soft cotton blend hoodie with premium finish.', true, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Classic Tee', 'classic-tee', 'Organic cotton crew neck tee.', false, true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Oversized Sweatshirt', 'oversized-sweatshirt', 'Relaxed fit sweatshirt for everyday comfort.', false, true),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Essential Crewneck', 'essential-crewneck', 'Minimalist crewneck in soft cotton.', false, true);

-- 4 Personalized Cups
INSERT INTO products (id, category_id, name, slug, description, is_customizable, is_active) VALUES
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'Ceramic Mug — Add your name', 'ceramic-mug-personalized', 'White ceramic mug with your name or message. Dishwasher safe.', true, true),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111102', 'Double-Wall Tumbler — Custom text', 'tumbler-personalized', 'Insulated tumbler with custom text. Keeps drinks hot or cold for hours.', true, true),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111102', 'Espresso Cup Set — Personalised', 'espresso-set-personalized', 'Set of 2 espresso cups with personalised text.', true, true),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111102', 'Travel Mug — Engraved message', 'travel-mug-personalized', 'Stainless steel travel mug with engraved message. Leak-proof.', true, true);

-- 4 Customized Hats with logos
INSERT INTO products (id, category_id, name, slug, description, is_customizable, is_active) VALUES
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111103', 'Logo Baseball Cap', 'logo-baseball-cap', 'Classic baseball cap with embroidered logo.', true, true),
  ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111103', 'Embroidered Dad Hat', 'embroidered-dad-hat', 'Unstructured dad hat with custom embroidered logo.', true, true),
  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111103', 'Snapback with Logo', 'snapback-logo', 'Adjustable snapback cap with your logo.', true, true),
  ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111103', 'Bucket Hat — Custom print', 'bucket-hat-custom', 'Canvas bucket hat with custom printed logo.', true, true);

-- Product variants
INSERT INTO product_variants (id, product_id, sku, name, price_cents, attributes, sort_order) VALUES
  -- Clothing
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'HOOD-BLK-M', 'Black / M', 8900, '{"size": "M", "color": "black"}', 1),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'HOOD-BLK-L', 'Black / L', 8900, '{"size": "L", "color": "black"}', 2),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202', 'TEE-WHT-M', 'White / M', 2900, '{"size": "M", "color": "white"}', 1),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', 'TEE-BLK-L', 'Black / L', 2900, '{"size": "L", "color": "black"}', 2),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222203', 'SWT-GRY-M', 'Grey / M', 6500, '{"size": "M", "color": "grey"}', 1),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222204', 'CREW-NVY-S', 'Navy / S', 4500, '{"size": "S", "color": "navy"}', 1),
  ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222204', 'CREW-NVY-M', 'Navy / M', 4500, '{"size": "M", "color": "navy"}', 2),
  -- Personalized Cups
  ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222205', 'MUG-11OZ', '11oz / White', 1900, '{"size": "11oz", "color": "white"}', 1),
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222206', 'TUMBLER-20OZ', '20oz / Black', 3500, '{"size": "20oz", "color": "black"}', 1),
  ('33333333-3333-3333-3333-333333333310', '22222222-2222-2222-2222-222222222206', 'TUMBLER-20OZ-WHT', '20oz / White', 3500, '{"size": "20oz", "color": "white"}', 2),
  ('33333333-3333-3333-3333-333333333311', '22222222-2222-2222-2222-222222222207', 'ESP-SET-2', 'Set of 2', 2800, '{}', 1),
  ('33333333-3333-3333-3333-333333333312', '22222222-2222-2222-2222-222222222208', 'TRAVEL-16OZ', '16oz / Stainless', 4200, '{"size": "16oz"}', 1),
  -- Customized Hats
  ('33333333-3333-3333-3333-333333333313', '22222222-2222-2222-2222-222222222209', 'CAP-BLK', 'Black', 2500, '{"color": "black"}', 1),
  ('33333333-3333-3333-3333-333333333314', '22222222-2222-2222-2222-222222222209', 'CAP-NVY', 'Navy', 2500, '{"color": "navy"}', 2),
  ('33333333-3333-3333-3333-333333333315', '22222222-2222-2222-2222-222222222210', 'DAD-BLK', 'Black', 2200, '{"color": "black"}', 1),
  ('33333333-3333-3333-3333-333333333316', '22222222-2222-2222-2222-222222222211', 'SNAP-WHT', 'White', 2800, '{"color": "white"}', 1),
  ('33333333-3333-3333-3333-333333333317', '22222222-2222-2222-2222-222222222211', 'SNAP-BLK', 'Black', 2800, '{"color": "black"}', 2),
  ('33333333-3333-3333-3333-333333333318', '22222222-2222-2222-2222-222222222212', 'BUCKET-KHK', 'Khaki', 3200, '{"color": "khaki"}', 1);

-- Product images (reliable picsum.photos - deterministic per seed)
INSERT INTO product_images (product_id, url, alt, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222201', 'https://picsum.photos/seed/hoodie/800/1000', 'Premium Hoodie', 1),
  ('22222222-2222-2222-2222-222222222202', 'https://picsum.photos/seed/tee/800/1000', 'Classic Tee', 1),
  ('22222222-2222-2222-2222-222222222203', 'https://picsum.photos/seed/sweatshirt/800/1000', 'Oversized Sweatshirt', 1),
  ('22222222-2222-2222-2222-222222222204', 'https://picsum.photos/seed/crewneck/800/1000', 'Essential Crewneck', 1),
  ('22222222-2222-2222-2222-222222222205', 'https://picsum.photos/seed/mug/800/1000', 'Ceramic Mug', 1),
  ('22222222-2222-2222-2222-222222222206', 'https://picsum.photos/seed/tumbler/800/1000', 'Double-Wall Tumbler', 1),
  ('22222222-2222-2222-2222-222222222207', 'https://picsum.photos/seed/espresso/800/1000', 'Espresso Cup Set', 1),
  ('22222222-2222-2222-2222-222222222208', 'https://picsum.photos/seed/travelmug/800/1000', 'Travel Mug', 1),
  ('22222222-2222-2222-2222-222222222209', 'https://picsum.photos/seed/baseballcap/800/1000', 'Logo Baseball Cap', 1),
  ('22222222-2222-2222-2222-222222222210', 'https://picsum.photos/seed/dadhat/800/1000', 'Embroidered Dad Hat', 1),
  ('22222222-2222-2222-2222-222222222211', 'https://picsum.photos/seed/snapback/800/1000', 'Snapback with Logo', 1),
  ('22222222-2222-2222-2222-222222222212', 'https://picsum.photos/seed/buckethat/800/1000', 'Bucket Hat', 1);

-- Product inventory
INSERT INTO product_inventory (variant_id, quantity) VALUES
  ('33333333-3333-3333-3333-333333333301', 50),
  ('33333333-3333-3333-3333-333333333302', 30),
  ('33333333-3333-3333-3333-333333333303', 100),
  ('33333333-3333-3333-3333-333333333304', 80),
  ('33333333-3333-3333-3333-333333333305', 40),
  ('33333333-3333-3333-3333-333333333306', 60),
  ('33333333-3333-3333-3333-333333333307', 60),
  ('33333333-3333-3333-3333-333333333308', 120),
  ('33333333-3333-3333-3333-333333333309', 80),
  ('33333333-3333-3333-3333-333333333310', 80),
  ('33333333-3333-3333-3333-333333333311', 50),
  ('33333333-3333-3333-3333-333333333312', 70),
  ('33333333-3333-3333-3333-333333333313', 45),
  ('33333333-3333-3333-3333-333333333314', 45),
  ('33333333-3333-3333-3333-333333333315', 55),
  ('33333333-3333-3333-3333-333333333316', 40),
  ('33333333-3333-3333-3333-333333333317', 40),
  ('33333333-3333-3333-3333-333333333318', 35);
