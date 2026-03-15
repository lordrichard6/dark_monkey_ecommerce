import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendReviewRequestEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  if (secret && authHeader !== `Bearer ${secret}` && cronHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  // Find orders shipped 7+ days ago with no review request sent
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, guest_email, user_id, currency, locale, review_request_sent_at, shipped_at, order_items(product_name)'
    )
    .eq('status', 'shipped')
    .lt('shipped_at', sevenDaysAgo)
    .is('review_request_sent_at', null)
    .limit(50)

  if (!orders?.length) return NextResponse.json({ ok: true, sent: 0, total: 0 })

  let sent = 0
  for (const order of orders) {
    try {
      let email = order.guest_email
      if (!email && order.user_id) {
        const { data: user } = await supabase.auth.admin.getUserById(order.user_id)
        email = user?.user?.email ?? null
      }
      if (!email) continue

      const productNames =
        (order.order_items as Array<{ product_name: string }>)
          ?.map((i) => i.product_name)
          .filter(Boolean) ?? []

      const ok = await sendReviewRequestEmail({
        to: email,
        orderId: order.id,
        productNames,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        locale: (order as any).locale ?? 'en',
      })

      if (ok) {
        await supabase
          .from('orders')
          .update({ review_request_sent_at: new Date().toISOString() })
          .eq('id', order.id)
        sent++
      }
    } catch (err) {
      console.error('[review-request cron] Error for order', order.id, err)
    }
  }

  return NextResponse.json({ ok: true, sent, total: orders.length })
}
