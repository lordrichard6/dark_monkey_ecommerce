-- Add is_archived flag to orders table.
-- Archived orders are excluded from accounting and statistics.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to speed up the common filter (non-archived orders).
CREATE INDEX IF NOT EXISTS orders_is_archived_idx ON orders (is_archived);
