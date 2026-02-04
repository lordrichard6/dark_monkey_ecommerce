import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendAbandonedCartEmail } from '@/lib/resend'

const CRON_SECRET = process.env.CRON_SECRET
const ABANDON_DELAY_HOURS = 1

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron job: send abandoned cart emails for checkouts started > ABANDON_DELAY_HOURS ago
 * that were not completed (no order) and not yet emailed.
 * Call with: Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = request.headers.get('x-cron-secret')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cronSecret

  if (CRON_SECRET && token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  const cutoff = new Date(Date.now() - ABANDON_DELAY_HOURS * 60 * 60 * 1000).toISOString()

  const { data: rows, error: fetchError } = await supabase
    .from('abandoned_checkouts')
    .select('id, email, cart_summary, created_at')
    .is('emailed_at', null)
    .lt('created_at', cutoff)

  if (fetchError) {
    console.error('Abandoned cart fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.dark-monkey.ch'
  const cartUrl = `${baseUrl}/checkout`

  let sent = 0
  for (const row of rows ?? []) {
    const summary = (row.cart_summary ?? {}) as {
      itemCount?: number
      totalCents?: number
      productNames?: string[]
    }
    const result = await sendAbandonedCartEmail({
      to: row.email,
      itemCount: summary.itemCount ?? 0,
      totalCents: summary.totalCents ?? 0,
      productNames: summary.productNames ?? [],
      cartUrl,
    })
    if (result.ok) {
      await supabase
        .from('abandoned_checkouts')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent, total: rows?.length ?? 0 })
}
