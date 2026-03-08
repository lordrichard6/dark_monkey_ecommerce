-- Shipping zones: editable from the admin panel
CREATE TABLE shipping_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL,
  first_item_cents INTEGER NOT NULL,
  additional_item_cents INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Seed with current hardcoded values
INSERT INTO shipping_zones (id, name, countries, first_item_cents, additional_item_cents, sort_order) VALUES
  ('ch',     'Switzerland', ARRAY['CH'],                   790,  290, 1),
  ('europe', 'Europe',      ARRAY['PT','ES','FR','DE'],    890,  350, 2),
  ('uk',     'UK',          ARRAY['GB'],                   990,  390, 3),
  ('us',     'USA',         ARRAY['US'],                  1290,  490, 4);

-- Generic key-value store for simple settings (e.g. free shipping threshold)
CREATE TABLE store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);

INSERT INTO store_settings (key, value, description) VALUES
  ('free_shipping_threshold_cents', '10000', 'Free shipping threshold in CHF cents. 10000 = CHF 100. Set to 0 to disable free shipping.');

-- Admin can read and write both tables; customers have no access
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- No public access — only service role (admin client) can read/write
