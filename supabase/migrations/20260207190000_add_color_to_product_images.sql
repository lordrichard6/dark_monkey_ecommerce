-- Add color column to product_images for filtering
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS color TEXT;
