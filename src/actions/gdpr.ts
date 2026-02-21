'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * Export all personal data for the authenticated user.
 * Returns a structured JSON object containing every table row that
 * references the user — suitable for a GDPR data portability request.
 */
export async function exportUserData(): Promise<{
  success: boolean
  data?: Record<string, unknown>
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const [
    { data: profile },
    { data: orders },
    { data: orderItems },
    { data: addresses },
    { data: wishlist },
    { data: reviews },
    { data: referrals },
    { data: xpEvents },
    { data: achievements },
    { data: deletionRequests },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at'),
    supabase
      .from('order_items')
      .select('*')
      .in(
        'order_id',
        (await supabase.from('orders').select('id').eq('user_id', user.id)).data?.map(
          (o) => o.id
        ) ?? []
      ),
    supabase.from('addresses').select('*').eq('user_id', user.id),
    supabase.from('user_wishlist').select('*').eq('user_id', user.id),
    supabase.from('product_reviews').select('*').eq('user_id', user.id),
    supabase.from('referrals').select('*').eq('referrer_id', user.id),
    supabase.from('xp_events').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id),
    supabase.from('data_deletion_requests').select('*').eq('user_id', user.id),
  ])

  return {
    success: true,
    data: {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      accountCreated: user.created_at,
      profile,
      orders: orders ?? [],
      orderItems: orderItems ?? [],
      addresses: addresses ?? [],
      wishlist: wishlist ?? [],
      reviews: reviews ?? [],
      referrals: referrals ?? [],
      xpEvents: xpEvents ?? [],
      achievements: achievements ?? [],
      deletionRequests: deletionRequests ?? [],
    },
  }
}

/**
 * Submit a data deletion request (Right to be Forgotten).
 * Creates a pending request — an admin will process it within 30 days.
 * Orders are anonymised (kept for accounting); personal data is deleted.
 */
export async function requestAccountDeletion(reason?: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if a pending/processing request already exists
  const { data: existing } = await supabase
    .from('data_deletion_requests')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: 'A deletion request is already pending. We will process it within 30 days.',
    }
  }

  const { error } = await supabase.from('data_deletion_requests').insert({
    user_id: user.id,
    email: user.email!,
    reason: reason ?? null,
    status: 'pending',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Admin: get all pending/processing deletion requests.
 */
export async function getAdminDeletionRequests() {
  const adminSupabase = getAdminClient()
  if (!adminSupabase) return { data: null, error: new Error('Admin client not configured') }
  const { data, error } = await adminSupabase
    .from('data_deletion_requests')
    .select('*')
    .order('requested_at', { ascending: true })
  return { data, error }
}
