-- Add admin_color to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS admin_color TEXT;

-- Set colours for the two admins
UPDATE user_profiles
SET admin_color = '#22c55e'
WHERE id = (SELECT id FROM auth.users WHERE email = 'paulo@lopes2tech.ch');

UPDATE user_profiles
SET admin_color = '#3b82f6'
WHERE id = (SELECT id FROM auth.users WHERE email = 'goncalopinto1@outlook.com');

-- Create product_votes table
CREATE TABLE IF NOT EXISTS product_votes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       TEXT        NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;

-- Admins can read all votes
CREATE POLICY "admins_read_votes"
  ON product_votes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
  ));

-- Admins can insert their own vote
CREATE POLICY "admins_insert_own_vote"
  ON product_votes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );

-- Admins can update their own vote
CREATE POLICY "admins_update_own_vote"
  ON product_votes FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can delete their own vote
CREATE POLICY "admins_delete_own_vote"
  ON product_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
