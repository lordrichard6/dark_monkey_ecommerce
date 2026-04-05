-- Migration: news feed feature tables
-- Created: 2026-04-05

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.feed_posts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text        NOT NULL CHECK (type IN ('drop', 'promo', 'story', 'community', 'new_product', 'sale')),
  title          text        NOT NULL,
  body           text,
  image_url      text,
  product_id     uuid        REFERENCES public.products(id) ON DELETE SET NULL,
  author_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published   boolean     NOT NULL DEFAULT true,
  published_at   timestamptz DEFAULT now(),
  likes_count    integer     NOT NULL DEFAULT 0,
  comments_count integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.feed_post_likes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE public.feed_post_comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       text        NOT NULL,
  is_deleted boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_feed_posts_published_at
  ON public.feed_posts (published_at DESC)
  WHERE is_published = true;

CREATE INDEX idx_feed_post_likes_post_id
  ON public.feed_post_likes (post_id);

CREATE INDEX idx_feed_post_comments_post_id
  ON public.feed_post_comments (post_id)
  WHERE is_deleted = false;

-- ============================================================
-- updated_at triggers (reuse existing update_updated_at fn)
-- ============================================================

CREATE TRIGGER feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER feed_post_comments_updated_at
  BEFORE UPDATE ON public.feed_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- likes_count trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_feed_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feed_post_likes_count
  AFTER INSERT OR DELETE ON public.feed_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_feed_post_likes_count();

-- ============================================================
-- comments_count trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_feed_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_deleted THEN
    UPDATE public.feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
    UPDATE public.feed_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feed_post_comments_count
  AFTER INSERT OR UPDATE ON public.feed_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_feed_post_comments_count();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.feed_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;

-- ---------- feed_posts policies ----------

CREATE POLICY "Anyone can read published posts"
  ON public.feed_posts
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage feed posts"
  ON public.feed_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------- feed_post_likes policies ----------

CREATE POLICY "Anyone can read likes"
  ON public.feed_post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.feed_post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own"
  ON public.feed_post_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------- feed_post_comments policies ----------

CREATE POLICY "Anyone can read non-deleted comments"
  ON public.feed_post_comments
  FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can comment"
  ON public.feed_post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete their own comments"
  ON public.feed_post_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
  ON public.feed_post_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
