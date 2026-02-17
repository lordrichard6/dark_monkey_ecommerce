-- Migration: Add increment_discount_use_count RPC function
-- Used by orders.ts after a successful checkout to enforce max_uses limits on discount codes.
-- The function uses an atomic UPDATE so concurrent orders cannot double-count.

CREATE OR REPLACE FUNCTION increment_discount_use_count(p_discount_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- runs with owner privileges, bypasses RLS
AS $$
BEGIN
  UPDATE discounts
  SET use_count = COALESCE(use_count, 0) + 1
  WHERE id = p_discount_id;
END;
$$;

-- Grant execute to service_role (used by admin Supabase client in orders.ts)
GRANT EXECUTE ON FUNCTION increment_discount_use_count(uuid) TO service_role;
