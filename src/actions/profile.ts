'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkProfileCompleteBadge } from '@/actions/gamification'

/**
 * Updates the display name of the currently authenticated user's profile.
 * Triggers a gamification badge check (`checkProfileCompleteBadge`) when a non-empty name is set.
 * Revalidates the `/account` page on success.
 *
 * @param displayName - New display name. Passing an empty string clears the name (sets to null).
 * @returns `{ ok: true }` on success or `{ ok: false, error }` if not authenticated or DB error.
 */
export async function updateProfile(displayName: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
