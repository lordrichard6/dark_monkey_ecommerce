-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create gallery_item_tags table to link items to existing tags
CREATE TABLE IF NOT EXISTS gallery_item_tags (
  item_id UUID NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Create gallery_votes table
CREATE TABLE IF NOT EXISTS gallery_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for guest votes
  fingerprint TEXT, -- For guest voting tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_item_tags_item_id ON gallery_item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_gallery_item_tags_tag_id ON gallery_item_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_gallery_votes_item_id ON gallery_votes(item_id);
CREATE INDEX IF NOT EXISTS idx_gallery_votes_user_id ON gallery_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_votes_fingerprint ON gallery_votes(fingerprint);

-- Triggers for updated_at
CREATE TRIGGER gallery_items_updated_at BEFORE UPDATE ON gallery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_votes ENABLE ROW LEVEL SECURITY;

-- Gallery Items Policies
CREATE POLICY "Public can view gallery items" ON gallery_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery items" ON gallery_items
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND (tier = 'vip' OR is_admin = true)
    )
  );

-- Gallery Item Tags Policies
CREATE POLICY "Public can view gallery item tags" ON gallery_item_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery item tags" ON gallery_item_tags
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND (tier = 'vip' OR is_admin = true)
    )
  );

-- Gallery Votes Policies
CREATE POLICY "Public can view votes" ON gallery_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert votes" ON gallery_votes
  FOR INSERT WITH CHECK (
    -- User must be authenticated and user_id must match
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "Guests can insert votes" ON gallery_votes
  FOR INSERT WITH CHECK (
    -- User is not authenticated (user_id is null)
    auth.role() = 'anon' AND user_id IS NULL AND fingerprint IS NOT NULL
  );
