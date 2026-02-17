'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Signs the current user out of their Supabase session and redirects to the homepage.
 * Errors during sign-out are silently ignored to ensure the redirect always fires.
 */
export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // ignore
  }
  redirect('/')
}
