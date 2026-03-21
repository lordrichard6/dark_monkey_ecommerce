-- Admin notification inbox
-- Stores events (new order, new signup) for admin visibility without email spam.

CREATE TABLE IF NOT EXISTS admin_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,           -- 'order' | 'signup' | 'support'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  data        JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast unread-count query
CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx
  ON admin_notifications (created_at DESC)
  WHERE read_at IS NULL;

-- No RLS needed — accessed only via service-role key (server-side admin actions)
