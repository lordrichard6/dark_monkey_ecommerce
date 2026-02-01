'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkProfileCompleteBadge } from '@/actions/gamification'

export async function updateProfile(displayName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName.trim() || null })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  if (displayName.trim()) {
    await checkProfileCompleteBadge(user.id)
  }
  revalidatePath('/account')
  return { ok: true }
}
