-- Avatar Storage Bucket Setup
-- Create storage bucket for user avatars with proper RLS policies

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- HELPER FUNCTION TO GET AVATAR URL
-- =====================================================
CREATE OR REPLACE FUNCTION get_avatar_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  profile_avatar TEXT;
  storage_url TEXT;
BEGIN
  -- Get avatar from profile
  SELECT avatar_url INTO profile_avatar
  FROM user_profiles
  WHERE id = user_id;

  IF profile_avatar IS NOT NULL THEN
    RETURN profile_avatar;
  END IF;

  -- Check if user has uploaded avatar in storage
  SELECT
    CONCAT(
      current_setting('app.settings.supabase_url', true),
      '/storage/v1/object/public/avatars/',
      user_id::text,
      '/',
      name
    )
  INTO storage_url
  FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = user_id::text
  ORDER BY created_at DESC
  LIMIT 1;

  IF storage_url IS NOT NULL THEN
    RETURN storage_url;
  END IF;

  -- Return null if no avatar found (will use Gravatar or generated avatar on client)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_avatar_url IS 'Get user avatar URL from profile or storage bucket';
