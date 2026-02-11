-- Push Notification Subscriptions
-- Stores user push notification subscriptions for PWA

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions for PWA users';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Push API subscription object (endpoint, keys)';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'Browser/device information';
COMMENT ON COLUMN push_subscriptions.last_used_at IS 'Last time notification was successfully sent';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether subscription is still valid';

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON push_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_push_subscription_timestamp();
