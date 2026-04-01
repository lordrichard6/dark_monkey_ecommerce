-- Admin board: internal task & idea tracker for admin team
CREATE TABLE IF NOT EXISTS admin_board_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text        NOT NULL CHECK (type IN ('task', 'idea')),
  title          text        NOT NULL,
  description    text,
  url            text,
  status         text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  priority       text        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by     uuid        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_to    uuid        REFERENCES user_profiles(id) ON DELETE SET NULL,
  completed_by   uuid        REFERENCES user_profiles(id) ON DELETE SET NULL,
  completed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_board_items_type     ON admin_board_items(type);
CREATE INDEX IF NOT EXISTS idx_board_items_status   ON admin_board_items(status);
CREATE INDEX IF NOT EXISTS idx_board_items_created  ON admin_board_items(created_at DESC);

-- Row Level Security — admin-only
ALTER TABLE admin_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on board items"
  ON admin_board_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
