-- Wishlist reminder emails: log when we send so we don't spam (e.g. max once per 7 days per user)
CREATE TABLE wishlist_reminder_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishlist_reminder_sent_user_sent ON wishlist_reminder_sent(user_id, sent_at DESC);

-- RLS: no policies so anon/authenticated cannot access; cron uses service role (bypasses RLS)
ALTER TABLE wishlist_reminder_sent ENABLE ROW LEVEL SECURITY;
