'use server'

import { createClient } from '@/lib/supabase/server'

export type PublicVote = 'up' | 'down'

export type VoteCounts = {
  up: number
  down: number
  userVote: PublicVote | null
}

export async function getProductVoteCounts(productId: string, sessionId: string): Promise<VoteCounts> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('public_product_votes')
    .select('vote, session_id')
    .eq('product_id', productId)

  const rows = data ?? []
  const up = rows.filter((r) => r.vote === 'up').length
  const down = rows.filter((r) => r.vote === 'down').length
  const userVote = (rows.find((r) => r.session_id === sessionId)?.vote as PublicVote) ?? null

  return { up, down, userVote }
}

export async function castPublicVote(
  productId: string,
  sessionId: string,
  vote: PublicVote
): Promise<VoteCounts> {
  const supabase = await createClient()

  // Check existing vote for this session
  const { data: existing } = await supabase
    .from('public_product_votes')
    .select('id, vote')
    .eq('product_id', productId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) {
    if (existing.vote === vote) {
      // Same vote → toggle off
      await supabase
        .from('public_product_votes')
        .delete()
        .eq('product_id', productId)
        .eq('session_id', sessionId)
    } else {
      // Different vote → switch
      await supabase
        .from('public_product_votes')
        .update({ vote })
        .eq('product_id', productId)
        .eq('session_id', sessionId)
    }
  } else {
    // No vote yet → insert
    await supabase
      .from('public_product_votes')
      .insert({ product_id: productId, session_id: sessionId, vote })
  }

  return getProductVoteCounts(productId, sessionId)
}

/** Fetch up/down totals for a list of product IDs (no session needed — just counts) */
export async function getVoteCountsForProducts(
  productIds: string[]
): Promise<Record<string, { up: number; down: number }>> {
  if (productIds.length === 0) return {}
  const supabase = await createClient()

  const { data } = await supabase
    .from('public_product_votes')
    .select('product_id, vote')
    .in('product_id', productIds)

  const result: Record<string, { up: number; down: number }> = {}
  for (const row of data ?? []) {
    if (!result[row.product_id]) result[row.product_id] = { up: 0, down: 0 }
    if (row.vote === 'up') result[row.product_id].up++
    else result[row.product_id].down++
  }
  return result
}
