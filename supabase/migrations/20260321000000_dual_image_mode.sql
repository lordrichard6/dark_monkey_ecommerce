-- Add dual_image_mode flag to products
-- When true, the product card shows two images with a diagonal cut effect
-- Image 1 = sort_order 0, Image 2 = sort_order 1 (managed via existing image manager)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dual_image_mode boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.dual_image_mode IS
  'When true, the product card renders two images (sort_order 0 and 1) with a diagonal split effect.';
