import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const rl = await rateLimit(getClientIp(req.headers), 'api')
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { productId, sessionId } = await req.json()

  if (!productId || !sessionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check for existing vote
  const { data: existing } = await supabase
    .from('public_product_votes')
    .select('id, vote')
    .eq('product_id', productId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) {
    // Same vote (up) → toggle off
    await supabase
      .from('public_product_votes')
      .delete()
      .eq('product_id', productId)
      .eq('session_id', sessionId)
  } else {
    // No vote yet → insert upvote
    await supabase
      .from('public_product_votes')
      .insert({ product_id: productId, session_id: sessionId, vote: 'up' })
  }

  // Return fresh counts
  const { data } = await supabase
    .from('public_product_votes')
    .select('vote, session_id')
    .eq('product_id', productId)

  const rows = data ?? []
  const up = rows.filter((r) => r.vote === 'up').length
  const voted = rows.some((r) => r.session_id === sessionId && r.vote === 'up')

  return NextResponse.json({ up, voted })
}
