-- Add multi-language description support and SEO meta description override
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_description TEXT;
