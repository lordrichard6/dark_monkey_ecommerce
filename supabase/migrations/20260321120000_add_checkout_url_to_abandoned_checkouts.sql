-- Add checkout_url so abandoned-cart emails can link directly to the
-- Stripe-hosted checkout page instead of a generic (empty) /checkout route.
-- Stripe session URLs are valid for 24 h; the cron fires after 1 h, so the link is always live.
ALTER TABLE abandoned_checkouts
  ADD COLUMN IF NOT EXISTS checkout_url TEXT;
