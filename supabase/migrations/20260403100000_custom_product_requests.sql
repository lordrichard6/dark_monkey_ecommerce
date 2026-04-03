-- ─────────────────────────────────────────────────────────────
-- Custom Product Studio
-- ─────────────────────────────────────────────────────────────

-- 1. Add exclusivity columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_exclusive       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exclusive_user_id  UUID      REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_exclusive_user_idx ON products (exclusive_user_id)
  WHERE exclusive_user_id IS NOT NULL;

-- 2. Custom product requests submitted by users
CREATE TABLE IF NOT EXISTS custom_product_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  images          TEXT[]      NOT NULL DEFAULT '{}',   -- public storage URLs (WebP)
  art_style       TEXT        NOT NULL,                -- e.g. 'minimalist', 'streetwear'
  article_type    TEXT        NOT NULL,                -- e.g. 'tshirt', 'hoodie'
  description     TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_review','ready','rejected')),
  change_count    INTEGER     NOT NULL DEFAULT 0,
  product_id      UUID        REFERENCES products(id) ON DELETE SET NULL, -- set when product is created
  admin_note      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS custom_product_requests_user_idx    ON custom_product_requests (user_id);
CREATE INDEX IF NOT EXISTS custom_product_requests_status_idx  ON custom_product_requests (status);

-- 3. Change requests on custom products (1 free, then CHF 2 each via Stripe)
CREATE TABLE IF NOT EXISTS custom_product_change_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID        NOT NULL REFERENCES custom_product_requests(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  note              TEXT        NOT NULL,
  is_free           BOOLEAN     NOT NULL DEFAULT FALSE,
  stripe_session_id TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS custom_change_requests_request_idx ON custom_product_change_requests (request_id);

-- 4. RLS — users only see their own requests
ALTER TABLE custom_product_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_product_change_requests ENABLE ROW LEVEL SECURITY;

-- Users: read/insert their own rows
CREATE POLICY "users_own_custom_requests" ON custom_product_requests
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_change_requests" ON custom_product_change_requests
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Service role bypasses RLS (admin actions use service-role key)
