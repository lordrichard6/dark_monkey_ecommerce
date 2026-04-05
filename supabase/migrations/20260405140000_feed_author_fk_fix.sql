-- Fix author_id FK: point to user_profiles instead of auth.users
-- This allows PostgREST to join feed_posts → user_profiles directly

ALTER TABLE public.feed_posts
  DROP CONSTRAINT IF EXISTS feed_posts_author_id_fkey;

ALTER TABLE public.feed_posts
  ADD CONSTRAINT feed_posts_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
