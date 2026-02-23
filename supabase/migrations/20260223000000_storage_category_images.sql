-- Create category-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view category images (public bucket)
CREATE POLICY "Public read access for category-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Authenticated admins can upload
CREATE POLICY "Admin upload access for category-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Authenticated admins can delete
CREATE POLICY "Admin delete access for category-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'category-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
