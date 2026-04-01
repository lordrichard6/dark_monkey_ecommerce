-- Expand status constraint to include idea-specific statuses
ALTER TABLE admin_board_items
  DROP CONSTRAINT IF EXISTS admin_board_items_status_check;

ALTER TABLE admin_board_items
  ADD CONSTRAINT admin_board_items_status_check
  CHECK (status IN ('open', 'in_progress', 'done', 'validated', 'discarded'));

-- Votes on ideas (one per admin per item, up or down)
CREATE TABLE IF NOT EXISTS admin_board_votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid        NOT NULL REFERENCES admin_board_items(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote       text        NOT NULL CHECK (vote IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_votes_item ON admin_board_votes(item_id);

ALTER TABLE admin_board_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on board votes"
  ON admin_board_votes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));

-- Comments on ideas
CREATE TABLE IF NOT EXISTS admin_board_comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid        NOT NULL REFERENCES admin_board_items(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_comments_item ON admin_board_comments(item_id);

ALTER TABLE admin_board_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on board comments"
  ON admin_board_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));
