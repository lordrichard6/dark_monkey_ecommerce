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

  if (!CRON_SECRET) {
    console.error('[cron/abandoned-cart] CRON_SECRET is not configured — all requests rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  const cutoff = new Date(Date.now() - ABANDON_DELAY_HOURS * 60 * 60 * 1000).toISOString()

  const { data: rows, error: fetchError } = await supabase
    .from('abandoned_checkouts')
    .select('id, email, cart_summary, checkout_url, created_at')
    .is('emailed_at', null)
    .lt('created_at', cutoff)

  if (fetchError) {
    console.error('Abandoned cart fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.dark-monkey.ch'

  let sent = 0
  for (const row of rows ?? []) {
    const summary = (row.cart_summary ?? {}) as {
      itemCount?: number
      totalCents?: number
      currency?: string
      locale?: string
      items?: { name?: string }[]
    }
    const locale = summary.locale ?? 'en'
    // Use the stored Stripe session URL (valid 24 h) so the customer can resume their
    // exact checkout. Fall back to the generic checkout page for older rows without it.
    const cartUrl =
      (row as { checkout_url?: string | null }).checkout_url ?? `${baseUrl}/${locale}/checkout`
    const productNames = (summary.items ?? []).map((i) => i.name ?? '').filter(Boolean)
    const result = await sendAbandonedCartEmail({
      to: row.email,
      itemCount: summary.itemCount ?? 0,
      totalCents: summary.totalCents ?? 0,
      currency: summary.currency ?? 'CHF',
      productNames,
      cartUrl,
      locale,
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
