'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function overrideCustomerTier(
  userId: string,
  tier: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const validTiers = ['bronze', 'silver', 'gold', 'platinum']
  if (!validTiers.includes(tier)) return { ok: false, error: 'Invalid tier' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin client not configured' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ current_tier: tier, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/customers/${userId}`)
  revalidatePath('/admin/customers')
  return { ok: true }
}

export async function confirmUserEmail(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin client not configured' }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/customers/${userId}`)
  revalidatePath('/admin/customers')
  return { ok: true }
}

export async function updateUserDisplayName(
  userId: string,
  displayName: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const trimmed = displayName.trim()
  if (!trimmed) return { ok: false, error: 'Display name cannot be empty' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin client not configured' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/customers/${userId}`)
  revalidatePath('/admin/customers')
  return { ok: true }
}

export async function generateCustomerSignInLink(
  userId: string
): Promise<{ ok: boolean; link?: string; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin client not configured' }

  const { data: authUser, error: fetchError } = await supabase.auth.admin.getUserById(userId)
  if (fetchError || !authUser?.user?.email)
    return { ok: false, error: 'No email found for this user' }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: authUser.user.email,
  })

  if (error || !data?.properties?.action_link)
    return { ok: false, error: error?.message ?? 'Failed to generate link' }

  return { ok: true, link: data.properties.action_link }
}
