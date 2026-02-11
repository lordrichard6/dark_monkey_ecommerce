-- User Profile & Gamification System
-- Comprehensive schema for user profiles, achievements, tiers, points, and referrals

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  birthday DATE,

  -- Personalization
  preferred_size TEXT, -- e.g., "M", "L", "XL"
  style_preferences JSONB DEFAULT '[]'::jsonb, -- Array of style tags

  -- Privacy
  is_public BOOLEAN DEFAULT false,

  -- Gamification
  total_points INTEGER DEFAULT 0,
  current_tier TEXT DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_progress DECIMAL(5,2) DEFAULT 0, -- Percentage to next tier

  -- Stats (calculated/cached)
  total_orders INTEGER DEFAULT 0,
  total_spent_cents BIGINT DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Icon name or emoji
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_reward INTEGER DEFAULT 0,
  condition_type TEXT NOT NULL, -- 'first_purchase', 'total_spent', 'review_count', etc.
  condition_value INTEGER, -- Threshold value for the condition
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (id, name, description, icon, tier, points_reward, condition_type, condition_value) VALUES
('first_purchase', 'First Purchase', 'Made your first purchase', '🎉', 'bronze', 100, 'order_count', 1),
('five_orders', '5 Orders', 'Completed 5 orders', '📦', 'bronze', 200, 'order_count', 5),
('ten_orders', '10 Orders', 'Completed 10 orders', '🏆', 'silver', 500, 'order_count', 10),
('first_review', 'First Review', 'Wrote your first review', '⭐', 'bronze', 50, 'review_count', 1),
('five_reviews', '5 Reviews', 'Wrote 5 reviews', '📝', 'bronze', 150, 'review_count', 5),
('ten_reviews', '10 Reviews', 'Wrote 10 reviews', '✍️', 'silver', 300, 'review_count', 10),
('bronze_tier', 'Bronze Member', 'Reached Bronze tier', '🥉', 'bronze', 0, 'tier', 0),
('silver_tier', 'Silver Member', 'Reached Silver tier', '🥈', 'silver', 500, 'tier', 1),
('gold_tier', 'Gold Member', 'Reached Gold tier', '🥇', 'gold', 1000, 'tier', 2),
('platinum_tier', 'Platinum Member', 'Reached Platinum tier', '💎', 'platinum', 2000, 'tier', 3),
('big_spender', 'Big Spender', 'Spent over CHF 1000', '💰', 'gold', 1000, 'total_spent', 100000),
('vip_shopper', 'VIP Shopper', 'Spent over CHF 5000', '👑', 'platinum', 5000, 'total_spent', 500000),
('referral_starter', 'Referral Starter', 'Referred 1 friend', '🤝', 'bronze', 200, 'referral_count', 1),
('referral_champion', 'Referral Champion', 'Referred 5 friends', '🌟', 'gold', 1000, 'referral_count', 5)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- USER ACHIEVEMENTS (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_user_referrals_referrer_id ON user_referrals(referrer_id);
CREATE INDEX idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX idx_user_referrals_status ON user_referrals(status);

-- Generate unique referral code for each user
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || user_id::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM user_referrals WHERE referral_code = code) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POINTS TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Can be positive (earned) or negative (spent)
  reason TEXT NOT NULL, -- 'purchase', 'review', 'referral', 'redemption', 'achievement'
  reference_id UUID, -- Order ID, review ID, achievement ID, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at DESC);

-- =====================================================
-- TIER THRESHOLDS (Configuration)
-- =====================================================
-- Bronze: CHF 0+
-- Silver: CHF 500+
-- Gold: CHF 2000+
-- Platinum: CHF 5000+

CREATE OR REPLACE FUNCTION calculate_user_tier(total_spent_cents BIGINT)
RETURNS TEXT AS $$
BEGIN
  IF total_spent_cents >= 500000 THEN -- CHF 5000
    RETURN 'platinum';
  ELSIF total_spent_cents >= 200000 THEN -- CHF 2000
    RETURN 'gold';
  ELSIF total_spent_cents >= 50000 THEN -- CHF 500
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_tier_progress(total_spent_cents BIGINT)
RETURNS DECIMAL AS $$
DECLARE
  current_tier TEXT;
  progress DECIMAL;
BEGIN
  current_tier := calculate_user_tier(total_spent_cents);

  IF current_tier = 'platinum' THEN
    RETURN 100;
  ELSIF current_tier = 'gold' THEN
    -- Progress from Gold (200000) to Platinum (500000)
    progress := ((total_spent_cents - 200000)::DECIMAL / 300000) * 100;
  ELSIF current_tier = 'silver' THEN
    -- Progress from Silver (50000) to Gold (200000)
    progress := ((total_spent_cents - 50000)::DECIMAL / 150000) * 100;
  ELSE
    -- Progress from Bronze (0) to Silver (50000)
    progress := (total_spent_cents::DECIMAL / 50000) * 100;
  END IF;

  RETURN LEAST(progress, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
  ON user_profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- User Achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view achievements of public profiles"
  ON user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_achievements.user_id
      AND user_profiles.is_public = true
    )
  );

-- Achievements (public read)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (is_active = true);

-- Referrals
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON user_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
  ON user_referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Points Transactions
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_user_profiles_tier ON user_profiles(current_tier);
CREATE INDEX idx_user_profiles_public ON user_profiles(is_public) WHERE is_public = true;
CREATE INDEX idx_user_profiles_total_spent ON user_profiles(total_spent_cents DESC);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE user_profiles IS 'Extended user profile data with gamification features';
COMMENT ON TABLE achievements IS 'Available achievements that users can unlock';
COMMENT ON TABLE user_achievements IS 'Achievements unlocked by users';
COMMENT ON TABLE user_referrals IS 'User referral tracking for friend invitations';
COMMENT ON TABLE points_transactions IS 'History of points earned and spent by users';
