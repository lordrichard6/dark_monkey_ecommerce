-- Fix feed_post_comments.user_id FK so PostgREST can join user_profiles
-- Previously referenced auth.users, which PostgREST cannot traverse to user_profiles

ALTER TABLE public.feed_post_comments
  DROP CONSTRAINT IF EXISTS feed_post_comments_user_id_fkey;

ALTER TABLE public.feed_post_comments
  ADD CONSTRAINT feed_post_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
