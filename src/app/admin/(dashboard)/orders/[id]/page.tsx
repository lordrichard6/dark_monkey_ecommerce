import Link from 'next/link'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import Image from 'next/image'
import { getAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { UpdateOrderStatusForm } from './update-order-status-form'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      total_cents,
      currency,
      guest_email,
      stripe_session_id,
      created_at,
      shipping_address_json,
      order_items (
        id,
        quantity,
        price_cents,
        config,
        product_variants (
          name,
          products (name, slug, product_images (url))
        )
      )
    `
    )
    .eq('id', id)
    .single()

  if (!order) notFound()

  const items = (order.order_items ?? []) as Array<{
    id: string
    quantity: number
    price_cents: number
    config?: Record<string, unknown>
    product_variants?: {
      products?: { name?: string; slug?: string; product_images?: Array<{ url: string }> } | null
    } | null
  }>
  const shipping = order.shipping_address_json as {
    name?: string
    address?: { line1?: string; line2?: string; city?: string; postalCode?: string; country?: string }
  } | null

  return (
    <div className="p-8">
      <Link href="/admin/orders" className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300">
        ← Back to orders
      </Link>
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Order #{order.id.slice(0, 8)}</h1>
          <p className="mt-2 text-zinc-400">
            {new Date(order.created_at).toLocaleString()} · {order.guest_email ?? 'Guest'}
          </p>
          {order.stripe_session_id && (
            <p className="mt-1 text-xs text-zinc-500">Stripe: {order.stripe_session_id}</p>
          )}
        </div>
        <UpdateOrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-zinc-50">Items</h2>
          <div className="mt-4 space-y-4">
            {items.map((item) => {
              const product = item.product_variants?.products ?? null
              const imgs = product?.product_images ?? []
              const img = imgs[0]
              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={product?.name ?? ''}
                        fill
                        className="object-cover"
                        unoptimized={img.url.includes('picsum.photos')}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product?.slug}`}
                      className="font-medium text-zinc-50 hover:text-amber-400"
                    >
                      {product?.name}
                    </Link>
                    {item.config && Object.keys(item.config).length > 0 && (
                      <p className="mt-1 text-xs text-amber-400/90">
                        Custom: {Object.entries(item.config).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-zinc-500">
                      Qty: {item.quantity} × {formatPrice(item.price_cents)}
                    </p>
                  </div>
                  <div className="text-right font-medium text-zinc-50">
                    {formatPrice(item.quantity * item.price_cents)}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-right text-lg font-semibold text-zinc-50">
            Total: {formatPrice(order.total_cents)}
          </p>
        </section>

        {shipping && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-50">Shipping address</h2>
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 text-zinc-400">
              {shipping.name && <p className="font-medium text-zinc-300">{shipping.name}</p>}
              {shipping.address && (
                <p className="mt-1">
                  {[shipping.address.line1, shipping.address.line2, shipping.address.city, shipping.address.postalCode, shipping.address.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
