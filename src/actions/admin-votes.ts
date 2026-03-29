'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type VoteType = 'up' | 'down'

export async function castProductVote(
  productId: string,
  vote: VoteType
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Not authenticated' }

  // Check for existing vote
  const { data: existing } = await supabase
    .from('product_votes')
    .select('id, vote')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.vote === vote) {
      // Same vote → toggle off
      const { error } = await supabase
        .from('product_votes')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id)
      if (error) return { ok: false, error: error.message }
    } else {
      // Different vote → switch
      const { error } = await supabase
        .from('product_votes')
        .update({ vote })
        .eq('product_id', productId)
        .eq('user_id', user.id)
      if (error) return { ok: false, error: error.message }
    }
  } else {
    // No vote yet → insert
    const { error } = await supabase
      .from('product_votes')
      .insert({ product_id: productId, user_id: user.id, vote })
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/admin/products')
  return { ok: true }
}
