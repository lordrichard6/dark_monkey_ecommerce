'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToWishlist(productId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

export async function removeFromWishlist(productId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

export async function toggleWishlist(productId: string, isInWishlist: boolean): Promise<{ ok: true; inWishlist: boolean } | { ok: false; error: string }> {
  if (isInWishlist) {
    const result = await removeFromWishlist(productId)
    return result.ok ? { ok: true, inWishlist: false } : result
  }
  const result = await addToWishlist(productId)
  return result.ok ? { ok: true, inWishlist: true } : result
}
