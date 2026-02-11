-- Track recent purchases for social proof indicators
-- Shows "X people bought this today" messages
-- Privacy-focused: only stores city/country, no personal data

CREATE TABLE recent_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT, -- City or Country for privacy (e.g., "Zurich, Switzerland")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast product queries (most common use case)
CREATE INDEX idx_recent_purchases_product_time 
ON recent_purchases(product_id, purchased_at DESC);

-- Index for cleanup queries (delete old entries)
CREATE INDEX idx_recent_purchases_created 
ON recent_purchases(created_at);

-- Enable RLS
ALTER TABLE recent_purchases ENABLE ROW LEVEL SECURITY;

-- Everyone can view recent purchases (public social proof)
CREATE POLICY "Recent purchases are viewable by everyone" 
ON recent_purchases FOR SELECT 
USING (true);

-- Only authenticated users (via service role in webhook) can insert
CREATE POLICY "Service role can insert recent purchases" 
ON recent_purchases FOR INSERT 
WITH CHECK (true);

-- Auto-cleanup function: delete purchases older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_purchases()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM recent_purchases
  WHERE purchased_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- Note: This will be managed via Supabase cron jobs or manual cleanup
COMMENT ON FUNCTION cleanup_old_purchases IS 'Deletes purchase records older than 7 days. Run daily via cron.';
