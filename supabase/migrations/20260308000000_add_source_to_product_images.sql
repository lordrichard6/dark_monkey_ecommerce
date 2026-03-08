-- Add source column to distinguish Printful CDN images from admin-uploaded custom images
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'printful'
    CHECK (source IN ('printful', 'custom'));

-- All existing rows are Printful CDN URLs
UPDATE product_images SET source = 'printful' WHERE source IS DISTINCT FROM 'printful';

-- Index for filtering by source (used in delete logic)
CREATE INDEX IF NOT EXISTS idx_product_images_source ON product_images (source);
