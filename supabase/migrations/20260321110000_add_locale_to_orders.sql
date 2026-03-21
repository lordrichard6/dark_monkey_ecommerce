-- Add locale to orders so transactional emails (review request, cancellation) can
-- be sent in the customer's language. Defaults to 'en' for existing rows.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';
