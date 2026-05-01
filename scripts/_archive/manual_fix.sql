-- Create table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  text text NOT NULL,
  url text NULL,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe (idempotent)
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Announcements are editable by admins" ON public.announcements;

-- Create policies
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);

CREATE POLICY "Announcements are editable by admins" ON public.announcements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

-- Fix migration history for announcements
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260215100000') ON CONFLICT (version) DO NOTHING;

-- Also fix history for newsletter if missing, to stop CLI complaining later
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260213') ON CONFLICT (version) DO NOTHING;
