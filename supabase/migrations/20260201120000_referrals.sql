-- Referral system: codes per user, referral tracking, rewards on first purchase
-- Each user has one referral code; referrals link referrer -> referred user; XP awarded when referred user makes first order

-- One referral code per user (code is unique, used in ?ref= links)
CREATE TABLE user_referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_referral_codes_code ON user_referral_codes(code);

-- Tracks who referred whom; first_order_id set when referred user completes first paid order
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  referrer_xp_awarded_at TIMESTAMPTZ,
  UNIQUE (referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_first_order ON referrals(first_order_id) WHERE first_order_id IS NOT NULL;

-- RLS
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral code" ON user_referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON user_referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read referrals where they are referrer or referred" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Inserts into referrals happen server-side (auth callback with service role or trusted action)
