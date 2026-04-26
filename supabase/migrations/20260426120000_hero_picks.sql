-- Hero picks: admin-curated products that appear in the homepage hero.
-- Designed for max 2 entries; the storefront query enforces the limit.
-- Separate table (rather than a flag on products) keeps ordering explicit and
-- avoids polluting the products table with another single-purpose column.

CREATE TABLE IF NOT EXISTS hero_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hero_picks_product_unique UNIQUE (product_id)
);

CREATE INDEX IF NOT EXISTS idx_hero_picks_sort ON hero_picks(sort_order, created_at DESC);

-- RLS: public read (the hero is public), admin write only.
ALTER TABLE hero_picks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hero_picks' AND policyname = 'hero_picks_public_read'
  ) THEN
    CREATE POLICY hero_picks_public_read ON hero_picks
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Writes happen server-side via the service-role admin client (which bypasses RLS),
-- so no admin write policy is required. Default-deny on writes for anon/authenticated
-- session users is exactly what we want.
