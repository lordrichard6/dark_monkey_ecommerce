'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export type ModeratePhotoResult = { ok: true } | { ok: false; error: string }

/**
 * Delete a specific photo from a review
 * Only admins can perform this action
 */
export async function deleteReviewPhoto(
  reviewId: string,
  photoUrl: string
): Promise<ModeratePhotoResult> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const adminClient = getAdminClient()
  if (!adminClient) return { ok: false, error: 'Server misconfiguration' }

  // Get current review
  const { data: review, error: fetchError } = await adminClient
    .from('product_reviews')
    .select('photos')
    .eq('id', reviewId)
    .single()

  if (fetchError || !review) {
    return { ok: false, error: 'Review not found' }
  }

  // Remove photo from array
  const updatedPhotos = (review.photos || []).filter((p: string) => p !== photoUrl)

  // Update review
  const { error: updateError } = await adminClient
    .from('product_reviews')
    .update({ photos: updatedPhotos })
    .eq('id', reviewId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  // Delete from storage
  try {
    const path = new URL(photoUrl).pathname.split('/').slice(-2).join('/')
    await adminClient.storage.from('review-photos').remove([path])
  } catch (err) {
    // Photo deleted from DB but not storage - acceptable
    console.error('Failed to delete from storage:', err)
  }

  revalidatePath('/admin/reviews')
  return { ok: true }
}

/**
 * Delete an entire review (including all photos)
 * Only admins can perform this action
 */
export async function deleteReview(reviewId: string): Promise<ModeratePhotoResult> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const adminClient = getAdminClient()
  if (!adminClient) return { ok: false, error: 'Server misconfiguration' }

  // Get review photos for cleanup
  const { data: review } = await adminClient
    .from('product_reviews')
    .select('photos')
    .eq('id', reviewId)
    .single()

  // Delete review
  const { error } = await adminClient.from('product_reviews').delete().eq('id', reviewId)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Clean up storage photos
  if (review?.photos && review.photos.length > 0) {
    try {
      const paths = review.photos.map((url: string) => {
        return new URL(url).pathname.split('/').slice(-2).join('/')
      })
      await adminClient.storage.from('review-photos').remove(paths)
    } catch (err) {
      console.error('Failed to delete photos from storage:', err)
    }
  }

  revalidatePath('/admin/reviews')
  return { ok: true }
}

/**
 * Get all reviews (paginated) for full admin management table
 */
export async function getAdminReviews(page: number = 1, perPage: number = 30) {
  const admin = await getAdminUser()
  if (!admin) return { data: null, count: 0, error: 'Not authorized' }

  const supabase = await createClient()

  const start = (page - 1) * perPage
  const end = start + perPage - 1

  const { data, count, error } = await supabase
    .from('product_reviews')
    .select(
      `
            id,
            rating,
            comment,
            photos,
            reviewer_display_name,
            created_at,
            products ( name, slug )
        `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(start, end)

  return { data, count: count ?? 0, error: error?.message }
}

/**
 * Get all reviews with photos for moderation
 */
export async function getReviewsWithPhotos() {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Not authorized' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_reviews')
    .select(
      `
      id,
      rating,
      comment,
      photos,
      reviewer_display_name,
      created_at,
      product_id,
      products (
        name,
        slug
      )
    `
    )
    .not('photos', 'eq', '{}')
    .order('created_at', { ascending: false })

  return { data, error: error?.message }
}
