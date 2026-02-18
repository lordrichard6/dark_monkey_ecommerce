'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { sendRestockAlert } from '@/lib/resend'
import { revalidatePath } from 'next/cache'

export async function sendVariantRestockNotifications(
  variantId: string,
  productName: string,
  productSlug: string
): Promise<{ sent: number; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { sent: 0, error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { sent: 0, error: 'Admin client not configured' }

  // Fetch all pending notifications for this variant
  const { data: pending, error: fetchError } = await supabase
    .from('stock_notifications')
    .select('id, email, product_name, variant_name')
    .eq('variant_id', variantId)
    .eq('notified', false)

  if (fetchError) return { sent: 0, error: fetchError.message }
  if (!pending?.length) return { sent: 0 }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const productUrl = `${baseUrl}/en/products/${productSlug}`

  let sent = 0
  const notifiedIds: string[] = []

  for (const row of pending) {
    const result = await sendRestockAlert({
      to: row.email,
      productName: row.product_name ?? productName,
      productUrl,
    })
    if (result.ok) {
      sent++
      notifiedIds.push(row.id)
    }
  }

  // Mark successfully notified rows
  if (notifiedIds.length > 0) {
    await supabase
      .from('stock_notifications')
      .update({ notified: true, notified_at: new Date().toISOString() })
      .in('id', notifiedIds)
  }

  revalidatePath('/admin/stock-notifications')
  return { sent }
}

export async function deleteStockNotification(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin client not configured' }

  const { error } = await supabase.from('stock_notifications').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/stock-notifications')
  return { ok: true }
}
