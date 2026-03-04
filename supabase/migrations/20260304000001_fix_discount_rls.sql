-- Fix discount RLS: restrict public SELECT to active/valid codes only
-- Previously USING (true) exposed all discount codes including expired and future-dated ones.

-- Drop the over-permissive policy
DROP POLICY IF EXISTS "Discounts are viewable by everyone" ON discounts;

-- Replace with a policy that only exposes currently valid codes:
--   valid_from <= NOW()  (discount has started)
--   valid_until IS NULL OR valid_until >= NOW()  (no expiry, or not yet expired)
--   max_uses IS NULL OR use_count < max_uses  (usage limit not reached)
CREATE POLICY "Discounts are viewable by everyone (valid only)" ON discounts
  FOR SELECT USING (
    valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR use_count < max_uses)
  );
