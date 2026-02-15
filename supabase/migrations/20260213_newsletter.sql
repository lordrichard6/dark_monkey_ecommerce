-- Create newsletter_subs table
CREATE TABLE IF NOT EXISTS public.newsletter_subs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_subs ENABLE ROW LEVEL SECURITY;

-- Allow service_role to do everything
DROP POLICY IF EXISTS "service_role_all" ON public.newsletter_subs;
CREATE POLICY "service_role_all" ON public.newsletter_subs
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow public to insert (with rate limiting handled at app level)
DROP POLICY IF EXISTS "public_insert_newsletter" ON public.newsletter_subs;
CREATE POLICY "public_insert_newsletter" ON public.newsletter_subs
    FOR INSERT WITH CHECK (true);

-- Allow admins to view
DROP POLICY IF EXISTS "admin_view_newsletter" ON public.newsletter_subs;
CREATE POLICY "admin_view_newsletter" ON public.newsletter_subs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );
