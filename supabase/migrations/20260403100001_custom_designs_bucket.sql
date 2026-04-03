-- Storage bucket for custom product design uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-designs',
  'custom-designs',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "custom_designs_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'custom-designs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read
CREATE POLICY "custom_designs_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-designs');

-- RLS: users can delete their own files
CREATE POLICY "custom_designs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'custom-designs' AND (storage.foldername(name))[1] = auth.uid()::text);
