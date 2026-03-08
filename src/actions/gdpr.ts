'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export type ExportSummary = {
  orders: number
  orderItems: number
  addresses: number
  wishlistItems: number
  reviews: number
  xpEvents: number
  achievements: number
  pushSubscriptions: number
}

/**
 * Export all personal data for the authenticated user (GDPR Art. 20 portability).
 * Also stamps last_data_export_at on user_profiles.
 */
export async function exportUserData(): Promise<{
  success: boolean
  data?: Record<string, unknown>
  summary?: ExportSummary
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Fetch order IDs first so we can fetch items in the same parallel batch
  const { data: orderRows } = await supabase.from('orders').select('id').eq('user_id', user.id)
  const orderIds = (orderRows ?? []).map((o) => o.id)

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
    { data: pushSubscriptions },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at'),
    orderIds.length > 0
      ? supabase.from('order_items').select('*').in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
    supabase.from('addresses').select('*').eq('user_id', user.id),
    supabase.from('user_wishlist').select('*').eq('user_id', user.id),
    supabase.from('product_reviews').select('*').eq('user_id', user.id),
    supabase.from('referrals').select('*').eq('referrer_id', user.id),
    supabase.from('xp_events').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id),
    supabase.from('data_deletion_requests').select('*').eq('user_id', user.id),
    supabase.from('push_subscriptions').select('created_at, is_active').eq('user_id', user.id),
  ])

  // Stamp the export timestamp (non-blocking — fire and forget)
  supabase
    .from('user_profiles')
    .update({ last_data_export_at: new Date().toISOString() })
    .eq('id', user.id)
    .then(() => {})

  const summary: ExportSummary = {
    orders: (orders ?? []).length,
    orderItems: (orderItems ?? []).length,
    addresses: (addresses ?? []).length,
    wishlistItems: (wishlist ?? []).length,
    reviews: (reviews ?? []).length,
    xpEvents: (xpEvents ?? []).length,
    achievements: (achievements ?? []).length,
    pushSubscriptions: (pushSubscriptions ?? []).length,
  }

  return {
    success: true,
    summary,
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
      pushSubscriptions: pushSubscriptions ?? [],
      deletionRequests: deletionRequests ?? [],
    },
  }
}

/**
 * Submit a data deletion request (GDPR Art. 17 right to erasure).
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
 * Cancel a pending deletion request (only allowed while status = 'pending').
 */
export async function cancelAccountDeletion(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('data_deletion_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'pending')

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
