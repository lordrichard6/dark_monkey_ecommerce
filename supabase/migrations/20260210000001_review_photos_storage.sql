-- Storage bucket for review photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true, -- Public bucket for easy CDN delivery
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- RLS Policies for review-photos bucket

-- Anyone can view review photos (public bucket)
CREATE POLICY "Review photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

-- Authenticated users can upload review photos
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text -- Photos must be in user's folder
);

-- Users can update their own review photos
CREATE POLICY "Users can update own review photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'review-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own review photos
CREATE POLICY "Users can delete own review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
