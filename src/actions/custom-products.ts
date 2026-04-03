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

  if (!input.images.length || input.images.length > 5)
    return { ok: false, error: 'Please upload between 1 and 5 images' }

  if (!input.description.trim()) return { ok: false, error: 'Description is required' }

  const { data, error } = await admin
    .from('custom_product_requests')
    .insert({
      user_id: userData.user.id,
      images: input.images,
      art_style: input.artStyle,
      article_type: input.articleType,
      description: input.description.trim(),
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to submit request' }

  // Get user email for notification
  const { data: profile } = await admin
    .from('user_profiles')
    .select('display_name, email')
    .eq('id', userData.user.id)
    .single()

  const userEmail = userData.user.email ?? (profile?.email as string | undefined)
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
      locale: input.locale ?? 'en',
    })
  }

  revalidatePath('/account/customize')
  revalidatePath('/account')
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
    // Insert free change request
    const { error: insertErr } = await admin.from('custom_product_change_requests').insert({
      request_id: input.requestId,
      user_id: userData.user.id,
      note: input.note.trim(),
      is_free: true,
      paid_at: new Date().toISOString(),
    })
    if (insertErr) return { ok: false, error: insertErr.message }

    // Increment change_count, set status back to in_review
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

    revalidatePath('/account/customize')
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

  // Pre-insert the change request as unpaid — webhook will mark it paid
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

  revalidatePath('/account/customize')
  revalidatePath(`/products`)
  return { ok: true }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

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
    .select('*, user_profiles(display_name, email)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query

  return (data ?? []).map((r) => {
    const profile = r.user_profiles as { display_name?: string; email?: string } | null
    return {
      ...(r as CustomProductRequest),
      user_email: profile?.email ?? undefined,
      user_name: profile?.display_name ?? undefined,
    }
  })
}

/**
 * Update the status of a custom product request (admin only).
 * When marking as 'ready', provide the productId that was created on Printful + synced.
 */
export async function updateCustomRequestStatus(input: {
  requestId: string
  status: 'in_review' | 'ready' | 'rejected'
  productId?: string
  adminNote?: string
}): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Service not configured' }

  const { data: req } = await admin
    .from('custom_product_requests')
    .select('user_id, article_type')
    .eq('id', input.requestId)
    .single()

  if (!req) return { ok: false, error: 'Request not found' }

  const updates: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }
  if (input.adminNote !== undefined) updates.admin_note = input.adminNote
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

    // Get user email to notify them
    const { data: profile } = await admin
      .from('user_profiles')
      .select('display_name, email')
      .eq('id', req.user_id)
      .single()

    // Get the user auth email as fallback
    const userEmail = profile?.email as string | undefined
    const userName = (profile?.display_name as string | undefined) ?? userEmail ?? 'Customer'

    if (userEmail) {
      await sendCustomProductReadyEmail({
        to: userEmail,
        userName,
        articleType: req.article_type,
        productUrl: `${APP_URL}/account/customize`,
        locale: 'en',
      })
    }
  }

  revalidatePath('/admin/custom-requests')
  revalidatePath('/account/customize')
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

  // Mark change request as paid
  await admin
    .from('custom_product_change_requests')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', changeReq.id)

  // Increment change_count on the parent request, set back to in_review
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
