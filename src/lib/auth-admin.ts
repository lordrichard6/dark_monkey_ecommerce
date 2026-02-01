import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function getAdminUser() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return null
  }
  if (!user) return null

  // Prefer admin client (service role); fallback to session client when service role key is not set
  const adminClient = getAdminClient()
  const client = adminClient ?? supabase

  const { data: profile } = await client
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return null
  return user
}

