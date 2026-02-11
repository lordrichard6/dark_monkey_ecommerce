'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SubmitReviewResult = { ok: true } | { ok: false; error: string }

/**
 * Submit or update a review for a product. User must be logged in.
 * One review per user per product (upsert by user_id + product_id).
 * Optionally pass orderId to mark as "verified purchase" (order must belong to user and contain the product).
 * @param photos - Array of Supabase Storage URLs for review photos (max 5)
 */
export async function submitReview(
  productId: string,
  rating: number,
  comment: string,
  orderId?: string,
  productSlug?: string,
  photos?: string[]
): Promise<SubmitReviewResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  if (rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5' }
  }

  let verifiedOrderId: string | null = null
  if (orderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()
    if (!order) return { ok: false, error: 'Order not found' }

    const { data: items } = await supabase
      .from('order_items')
      .select('product_variants!inner(product_id)')
      .eq('order_id', orderId)
    const productIds = (items ?? []).map(
      (i: any) => i.product_variants?.product_id
    )
    if (productIds.includes(productId)) verifiedOrderId = orderId
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const reviewerDisplayName =
    (profile?.display_name?.trim()) || user.email?.split('@')[0] || 'Customer'

  const { error } = await supabase.from('product_reviews').upsert(
    {
      product_id: productId,
      user_id: user.id,
      order_id: verifiedOrderId ?? null,
      rating: Math.round(rating),
      comment: comment.trim() || null,
      reviewer_display_name: reviewerDisplayName,
      photos: photos || [],
    },
    { onConflict: 'user_id,product_id' }
  )

  if (error) return { ok: false, error: error.message }

  if (productSlug) revalidatePath(`/products/${productSlug}`)
  revalidatePath('/account/orders')
  return { ok: true }
}
