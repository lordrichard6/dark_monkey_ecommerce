'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { createAdminNotification } from '@/lib/admin-notifications'
import { sendCustomRequestReceivedEmail, sendCustomProductReadyEmail } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import {
  ARTICLE_PRICES_CENTS,
  type ArtStyle,
  type ArticleType,
  type CustomProductRequest,
  type CustomProductChangeRequest,
} from '@/lib/custom-products-config'

export type {
  ArtStyle,
  ArticleType,
  CustomProductRequest,
  CustomProductChangeRequest,
} from '@/lib/custom-products-config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.dark-monkey.ch'

// CHF 2 in cents
const CHANGE_REQUEST_PRICE_CENTS = 200

// Valid enum values for server-side validation (#9)
const VALID_ART_STYLES: ArtStyle[] = [
  'minimalist',
  'streetwear',
  'vintage',
  'abstract',
  'geometric',
  'anime',
  'typography',
  'photorealistic',
]
const VALID_ARTICLE_TYPES: ArticleType[] = [
  'tshirt',
  'hoodie',
  'sweatshirt',
  'cap',
  'tote_bag',
  'mug',
  'phone_case',
]

/** Revalidate all locale variants of a path (#5) */
function revalidateLocales(segment: string) {
  revalidatePath('/', 'layout')
  void segment // used for intent documentation only
}

// ─── User Actions ─────────────────────────────────────────────────────────────

/**
 * Submit a new custom product request.
 */
export async function submitCustomProductRequest(input: {
  images: string[]
  artStyle: ArtStyle
  articleType: ArticleType
  description: string
  locale?: string
}): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'Unauthorized' }

  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Service not configured' }

  // Server-side validation (#9)
  if (!input.images.length || input.images.length > 5)
    return { ok: false, error: 'Please upload between 1 and 5 images' }
  if (!input.description.trim()) return { ok: false, error: 'Description is required' }
  if (!VALID_ART_STYLES.includes(input.artStyle)) return { ok: false, error: 'Invalid art style' }
  if (!VALID_ARTICLE_TYPES.includes(input.articleType))
    return { ok: false, error: 'Invalid article type' }

  const locale = input.locale ?? 'en'

  const { data, error } = await admin
    .from('custom_product_requests')
    .insert({
      user_id: userData.user.id,
      images: input.images,
      art_style: input.artStyle,
      article_type: input.articleType,
      description: input.description.trim(),
      status: 'pending',
      locale, // store for later use in ready-notification email (#7)
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to submit request' }

  // Get user display name for notification
  const { data: profile } = await admin
    .from('user_profiles')
    .select('display_name')
    .eq('id', userData.user.id)
    .single()

  const userEmail = userData.user.email
  const userName = (profile?.display_name as string | undefined) ?? userEmail ?? 'Customer'

  // Admin notification
  await createAdminNotification({
    type: 'custom_request',
    title: 'New Custom Product Request',
    body: `${userName} requested a custom ${input.articleType} in ${input.artStyle} style.`,
    data: { requestId: data.id, userId: userData.user.id, articleType: input.articleType },
  })

  // Confirmation email to user
  if (userEmail) {
    await sendCustomRequestReceivedEmail({
      to: userEmail,
      userName,
      articleType: input.articleType,
      artStyle: input.artStyle,
      estimatedPriceCents: ARTICLE_PRICES_CENTS[input.articleType],
      locale,
    })
  }

  revalidateLocales('/account/customize')
  return { ok: true, requestId: data.id }
}

/**
 * Get all custom product requests for the current user.
 */
export async function getMyCustomRequests(): Promise<CustomProductRequest[]> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const admin = getAdminClient()
  if (!admin) return []

  const { data } = await admin
    .from('custom_product_requests')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as CustomProductRequest[]
}

/**
 * Submit a change request on a custom product.
 * - 1st change: free
 * - 2nd+: CHF 2 via Stripe Checkout → returns checkout URL
 */
export async function submitChangeRequest(input: {
  requestId: string
  note: string
  locale?: string
}): Promise<
  | { ok: true; free: true }
  | { ok: true; free: false; checkoutUrl: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'Unauthorized' }

  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Service not configured' }

  // Verify the request belongs to this user and is in 'ready' status
  const { data: req, error: fetchErr } = await admin
    .from('custom_product_requests')
    .select('id, user_id, change_count, status, article_type')
    .eq('id', input.requestId)
    .single()

  if (fetchErr || !req) return { ok: false, error: 'Request not found' }
  if (req.user_id !== userData.user.id) return { ok: false, error: 'Unauthorized' }
  if (req.status !== 'ready')
    return { ok: false, error: 'Changes can only be requested once the product is ready' }

  const isFree = req.change_count === 0

  if (isFree) {
    const { error: insertErr } = await admin.from('custom_product_change_requests').insert({
      request_id: input.requestId,
      user_id: userData.user.id,
      note: input.note.trim(),
      is_free: true,
      paid_at: new Date().toISOString(),
    })
    if (insertErr) return { ok: false, error: insertErr.message }

    await admin
      .from('custom_product_requests')
      .update({
        change_count: req.change_count + 1,
        status: 'in_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.requestId)

    await createAdminNotification({
      type: 'custom_request',
      title: 'Custom Product Change Requested (Free)',
      body: `User requested a free change on their custom ${req.article_type}.`,
      data: { requestId: input.requestId, note: input.note },
    })

    revalidateLocales('/account/customize')
    return { ok: true, free: true }
  }

  // Paid change — create Stripe Checkout Session
  const stripe = getStripe()
  if (!stripe) return { ok: false, error: 'Payment not configured' }

  const locale = input.locale ?? 'en'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'chf',
          unit_amount: CHANGE_REQUEST_PRICE_CENTS,
          product_data: {
            name: 'Custom Product Change Request',
            description: 'One design change request for your custom product',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'custom_change_request',
      requestId: input.requestId,
      userId: userData.user.id,
      note: input.note.trim().slice(0, 500),
    },
    success_url: `${APP_URL}/${locale}/account/customize?change=success`,
    cancel_url: `${APP_URL}/${locale}/account/customize?change=cancelled`,
  })

  if (!session.url) return { ok: false, error: 'Failed to create payment session' }

  await admin.from('custom_product_change_requests').insert({
    request_id: input.requestId,
    user_id: userData.user.id,
    note: input.note.trim(),
    is_free: false,
    stripe_session_id: session.id,
  })

  return { ok: true, free: false, checkoutUrl: session.url }
}

/**
 * Make a custom product public (removes exclusivity).
 */
export async function makeCustomProductPublic(
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'Unauthorized' }

  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Service not configured' }

  const { data: req } = await admin
    .from('custom_product_requests')
    .select('user_id, product_id, status')
    .eq('id', requestId)
    .single()

  if (!req || req.user_id !== userData.user.id) return { ok: false, error: 'Not found' }
  if (req.status !== 'ready' || !req.product_id)
    return { ok: false, error: 'Product not ready yet' }

  const { error } = await admin
    .from('products')
    .update({ is_exclusive: false, exclusive_user_id: null })
    .eq('id', req.product_id)

  if (error) return { ok: false, error: error.message }

  revalidateLocales('/account/customize')
  return { ok: true }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

/**
 * Get per-status counts for the filter tab badges (#10).
 */
export async function getCustomRequestStatusCounts(): Promise<Record<string, number>> {
  const admin = getAdminClient()
  if (!admin) return {}

  const statuses = ['pending', 'in_review', 'ready', 'rejected'] as const
  const results = await Promise.all(
    statuses.map((s) =>
      admin
        .from('custom_product_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', s)
    )
  )

  const counts: Record<string, number> = {}
  let total = 0
  statuses.forEach((s, i) => {
    counts[s] = results[i].count ?? 0
    total += counts[s]
  })
  counts.all = total
  return counts
}

/**
 * Get all custom product requests (admin only).
 */
export async function getAdminCustomRequests(
  status?: string
): Promise<(CustomProductRequest & { user_email?: string; user_name?: string })[]> {
  const admin = getAdminClient()
  if (!admin) return []

  let query = admin
    .from('custom_product_requests')
    .select('*, user_profiles(display_name)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query
  if (!data) return []

  // Batch-fetch emails from auth (#8 — concurrent, not sequential)
  const userIds = [...new Set(data.map((r) => r.user_id as string))]
  const emailMap: Record<string, string> = {}
  await Promise.all(
    userIds.map(async (uid) => {
      const { data: authUser } = await admin.auth.admin.getUserById(uid)
      if (authUser.user?.email) emailMap[uid] = authUser.user.email
    })
  )

  return data.map((r) => {
    const profile = r.user_profiles as { display_name?: string } | null
    return {
      ...(r as CustomProductRequest),
      user_email: emailMap[r.user_id as string] ?? undefined,
      user_name: profile?.display_name ?? undefined,
    }
  })
}

/**
 * Update the status of a custom product request (admin only).
 * Accepts all statuses including 'pending' for re-opening rejected requests (#2).
 * Only updates admin_note if a non-empty string is provided — preserves existing note otherwise (#13).
 */
export async function updateCustomRequestStatus(input: {
  requestId: string
  status: 'pending' | 'in_review' | 'ready' | 'rejected'
  productId?: string
  adminNote?: string
}): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Service not configured' }

  const { data: req } = await admin
    .from('custom_product_requests')
    .select('user_id, article_type, locale')
    .eq('id', input.requestId)
    .single()

  if (!req) return { ok: false, error: 'Request not found' }

  const updates: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }
  // Only overwrite note if the admin explicitly provided a non-empty value (#13)
  if (input.adminNote && input.adminNote.trim()) {
    updates.admin_note = input.adminNote.trim()
  }
  if (input.productId) updates.product_id = input.productId

  const { error } = await admin
    .from('custom_product_requests')
    .update(updates)
    .eq('id', input.requestId)

  if (error) return { ok: false, error: error.message }

  // If marking ready + linking a product → set that product as exclusive
  if (input.status === 'ready' && input.productId) {
    await admin
      .from('products')
      .update({ is_exclusive: true, exclusive_user_id: req.user_id })
      .eq('id', input.productId)

    const [{ data: profile }, { data: authUser }] = await Promise.all([
      admin.from('user_profiles').select('display_name').eq('id', req.user_id).single(),
      admin.auth.admin.getUserById(req.user_id),
    ])

    const userEmail = authUser.user?.email
    const userName = (profile?.display_name as string | undefined) ?? userEmail ?? 'Customer'
    const locale = (req.locale as string | null) ?? 'en' // use stored locale (#7)

    if (userEmail) {
      await sendCustomProductReadyEmail({
        to: userEmail,
        userName,
        articleType: req.article_type,
        productUrl: `${APP_URL}/${locale}/account/customize`,
        locale,
      })
    }
  }

  revalidateLocales('/admin/custom-requests')
  return { ok: true }
}

/**
 * Resend the "product ready" notification email (admin only) (#11).
 */
export async function resendCustomProductReadyNotification(
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Service not configured' }

  const { data: req } = await admin
    .from('custom_product_requests')
    .select('user_id, article_type, product_id, status, locale')
    .eq('id', requestId)
    .single()

  if (!req) return { ok: false, error: 'Request not found' }
  if (req.status !== 'ready') return { ok: false, error: 'Product is not ready yet' }
  if (!req.product_id) return { ok: false, error: 'No product linked yet' }

  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin.from('user_profiles').select('display_name').eq('id', req.user_id).single(),
    admin.auth.admin.getUserById(req.user_id),
  ])

  const userEmail = authUser.user?.email
  if (!userEmail) return { ok: false, error: 'User email not found' }

  const userName = (profile?.display_name as string | undefined) ?? userEmail
  const locale = (req.locale as string | null) ?? 'en'

  await sendCustomProductReadyEmail({
    to: userEmail,
    userName,
    articleType: req.article_type,
    productUrl: `${APP_URL}/${locale}/account/customize`,
    locale,
  })

  return { ok: true }
}

/**
 * Mark a paid change request as paid (called from Stripe webhook).
 */
export async function markChangeRequestPaid(stripeSessionId: string): Promise<void> {
  const admin = getAdminClient()
  if (!admin) return

  const { data: changeReq } = await admin
    .from('custom_product_change_requests')
    .select('id, request_id')
    .eq('stripe_session_id', stripeSessionId)
    .single()

  if (!changeReq) return

  await admin
    .from('custom_product_change_requests')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', changeReq.id)

  const { data: parentReq } = await admin
    .from('custom_product_requests')
    .select('change_count')
    .eq('id', changeReq.request_id)
    .single()

  if (parentReq) {
    await admin
      .from('custom_product_requests')
      .update({
        change_count: parentReq.change_count + 1,
        status: 'in_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', changeReq.request_id)
  }

  await createAdminNotification({
    type: 'custom_request',
    title: 'Custom Product Change Request Paid',
    body: `A paid change request (CHF 2) has been processed.`,
    data: { requestId: changeReq.request_id, stripeSessionId },
  })
}
