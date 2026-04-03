-- Store the user's locale so ready-notification emails use the correct language
ALTER TABLE custom_product_requests
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';
