-- Set paulo@lopes2tech.ch as admin
-- Run in Supabase SQL Editor (local: http://127.0.0.1:54323 or cloud dashboard)
-- Use the SAME Supabase project your app is connected to (check .env.local)

-- 1. Ensure user_profiles row exists (in case user was created before trigger)
INSERT INTO public.user_profiles (id, display_name)
SELECT id, COALESCE(
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'name',
  split_part(email, '@', 1)
)
FROM auth.users
WHERE LOWER(email) = 'paulo@lopes2tech.ch'
ON CONFLICT (id) DO NOTHING;

-- 2. Grant admin
UPDATE user_profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE LOWER(email) = 'paulo@lopes2tech.ch');

-- Verify (optional): SELECT id, display_name, is_admin FROM user_profiles WHERE id IN (SELECT id FROM auth.users WHERE LOWER(email) = 'paulo@lopes2tech.ch');
