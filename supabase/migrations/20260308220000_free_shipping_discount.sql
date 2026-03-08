-- Add free_shipping as a valid discount type
ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_type_check;
ALTER TABLE discounts
  ADD CONSTRAINT discounts_type_check CHECK (type IN ('percentage', 'fixed', 'free_shipping'));

-- Launch discount: free shipping for first 20 orders
INSERT INTO discounts (code, type, value_cents, min_order_cents, valid_from, max_uses)
VALUES ('LAUNCH', 'free_shipping', 0, 0, NOW(), 20);

-- Announcement bar: promo variant, all locales
INSERT INTO announcements (text, active, position, variant)
VALUES (
  '🚀 Grand Opening! Use code LAUNCH for free shipping — first 20 orders only!',
  true,
  0,
  'promo'
);
