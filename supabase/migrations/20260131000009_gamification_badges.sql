-- Badges and user badge assignments
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Tier thresholds (XP): bronze 0, silver 100, gold 500, vip 2000
-- Stored in app logic; no DB change needed for user_profiles.tier

-- Seed default badges
INSERT INTO badges (code, name, description, icon, sort_order) VALUES
  ('first_purchase', 'First Purchase', 'Completed your first order', '🛒', 10),
  ('early_adopter', 'Early Adopter', 'Joined during launch', '🚀', 20),
  ('profile_complete', 'Profile Pro', 'Completed your profile', '✅', 30),
  ('five_orders', 'Regular', 'Placed 5 orders', '⭐', 40),
  ('ten_orders', 'Loyal Customer', 'Placed 10 orders', '💎', 50);
