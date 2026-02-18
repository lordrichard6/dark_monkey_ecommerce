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
