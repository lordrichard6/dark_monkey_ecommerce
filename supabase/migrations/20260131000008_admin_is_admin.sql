-- Add is_admin to user_profiles for admin panel access
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- To grant admin: UPDATE user_profiles SET is_admin = true WHERE id = 'user-uuid';
