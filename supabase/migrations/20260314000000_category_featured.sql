-- Add is_featured flag and optional subtitle to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subtitle TEXT;
