
-- Fix Social Proof Tables and Missing Schemas

-- 1. Create product_views table (Missing in previous migrations)
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for recently viewed
CREATE INDEX IF NOT EXISTS idx_product_views_user_created 
ON public.product_views(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_views_session_created 
ON public.product_views(session_id, created_at DESC);

-- Enable RLS on product_views
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views
CREATE POLICY "Public can insert product views" 
ON public.product_views FOR INSERT 
WITH CHECK (true);

-- Users can view their own history
CREATE POLICY "Users can view own product views" 
ON public.product_views FOR SELECT 
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- 2. Ensure recent_purchases has proper RLS
-- (Re-applying policies to be sure)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recent_purchases') THEN
        DROP POLICY IF EXISTS "Recent purchases are viewable by everyone" ON public.recent_purchases;
        DROP POLICY IF EXISTS "Service role can insert recent purchases" ON public.recent_purchases;
        
        CREATE POLICY "Recent purchases are viewable by everyone" 
        ON public.recent_purchases FOR SELECT 
        USING (true);

        CREATE POLICY "Service role can insert recent purchases" 
        ON public.recent_purchases FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- 3. Enable Realtime for these tables
-- First, ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.recent_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_views;
