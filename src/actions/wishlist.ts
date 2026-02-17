'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Adds a product to the authenticated user's wishlist.
 * Uses upsert to prevent duplicate entries.
 * Revalidates wishlist and product listing pages on success.
 *
 * @param productId - UUID of the product to add.
 * @returns `{ ok: true }` on success or `{ ok: false, error }` if not authenticated or DB error.
 */
export async function addToWishlist(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in to save items' }

  const { error } = await supabase
    .from('user_wishlist')
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: 'user_id,product_id' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/account/wishlist')
  revalidatePath('/categories')
  revalidatePath(`/products`)
  revalidatePath(`/products/[slug]`)
  return { ok: true }
}

/**
 * Removes a product from the authenticated user's wishlist.
 * Revalidates wishlist and product listing pages on success.
 *
 * @param productId - UUID of the product to remove.
 * @returns `{ ok: true }` on success or `{ ok: false, error }` if not authenticated or DB error.
 */
export async function removeFromWishlist(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_wishlist')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/account/wishlist')
  revalidatePath('/categories')
  revalidatePath(`/products`)
  revalidatePath(`/products/[slug]`)
  return { ok: true }
}

/**
 * Toggles a product's wishlist status for the authenticated user.
 * Adds the product if `isInWishlist` is false; removes it if true.
 *
 * @param productId - UUID of the product to toggle.
 * @param isInWishlist - Current wishlist state of the product.
 * @returns `{ ok: true, inWishlist: boolean }` reflecting the new state, or `{ ok: false, error }` on failure.
 */
export async function toggleWishlist(
  productId: string,
  isInWishlist: boolean
): Promise<{ ok: true; inWishlist: boolean } | { ok: false; error: string }> {
  if (isInWishlist) {
    const result = await removeFromWishlist(productId)
    return result.ok ? { ok: true, inWishlist: false } : result
  }
  const result = await addToWishlist(productId)
  return result.ok ? { ok: true, inWishlist: true } : result
}
