import { getAdminClient } from '@/lib/supabase/admin'
import { sendRestockAlert } from '@/lib/resend'

/**
 * Notify users who have this product on their wishlist that it is back in stock.
 * Call after admin updates inventory from 0 to a positive quantity.
 */
export async function notifyRestockAlerts(productId: string): Promise<{ sent: number; error?: string }> {
  const supabase = getAdminClient()
  if (!supabase) return { sent: 0, error: 'Admin not configured' }

  if (!process.env.RESEND_API_KEY?.trim()) return { sent: 0 }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('id', productId)
    .single()

  if (productError || !product) return { sent: 0, error: productError?.message ?? 'Product not found' }

  const { data: wishlistRows } = await supabase
    .from('user_wishlist')
    .select('user_id')
    .eq('product_id', productId)

  if (!wishlistRows?.length) return { sent: 0 }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const productUrl = baseUrl ? `${baseUrl}/en/products/${product.slug}` : `/en/products/${product.slug}`
  const productName = product.name ?? 'A product you saved'

  let sent = 0
  const seen = new Set<string>()
  for (const row of wishlistRows) {
    if (seen.has(row.user_id)) continue
    seen.add(row.user_id)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.admin.getUserById(row.user_id)
      if (userError || !user?.email) continue
      const result = await sendRestockAlert({
        to: user.email,
        productName,
        productUrl,
      })
      if (result.ok) sent++
    } catch {
      // skip on error
    }
  }
  return { sent }
}
