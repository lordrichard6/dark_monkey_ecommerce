-- Abandoned checkouts: record when user starts Stripe Checkout; clear when order completes.
-- Used by cron to send reminder emails (email + cart summary) after delay.
CREATE TABLE abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  cart_summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emailed_at TIMESTAMPTZ
);

CREATE INDEX idx_abandoned_checkouts_created ON abandoned_checkouts(created_at);
CREATE INDEX idx_abandoned_checkouts_emailed ON abandoned_checkouts(emailed_at) WHERE emailed_at IS NULL;

ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Allow insert when creating checkout session (user or guest). SELECT/UPDATE only via service role (cron).
CREATE POLICY "Allow insert abandoned checkouts" ON abandoned_checkouts
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE abandoned_checkouts IS 'Filled when checkout session is created; cleared on order completion. Cron sends reminder if emailed_at is null and created_at is old enough.';
