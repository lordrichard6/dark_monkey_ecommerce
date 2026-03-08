-- Replace the full UNIQUE constraint on products.slug with a partial unique index
-- that only enforces uniqueness among non-deleted (active/inactive) products.
-- This allows reusing a slug after a product is soft-deleted.

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_key;
DROP INDEX IF EXISTS products_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_active_unique
  ON products(slug)
  WHERE deleted_at IS NULL;
