-- Function to list all auth users with their display names.
-- Uses SECURITY DEFINER so it can access auth.users regardless of caller role.
-- Called via supabase.rpc() through PostgREST (avoids the GoTrue admin API).
CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE (id uuid, email text, display_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    au.id,
    au.email,
    up.display_name
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  WHERE au.email IS NOT NULL
  ORDER BY au.email ASC;
$$;

-- Only admins (service role) should call this
REVOKE ALL ON FUNCTION public.get_users_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_list() TO service_role;
