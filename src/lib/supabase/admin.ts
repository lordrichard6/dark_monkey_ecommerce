import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

export function getAdminClient() {
  if (!url || !key) return null
  return createClient(url, key)
}
