import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

type Props = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    //
  }

  if (!user) notFound()

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      total_cents,
      currency,
      created_at,
      shipping_address_json,
      order_items (
        id,
        quantity,
        price_cents,
        config,
        product_variants (
          name,
          products (
            name,
            slug,
            product_images (url, alt)
          )
        )
      )
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const items = (order.order_items ?? []) as Array<{
    id: string
    quantity: number
    price_cents: number
    config?: Record<string, unknown>
    product_variants?: {
      name?: string
      products?: {
        name?: string
        slug?: string
        product_images?: Array<{ url: string; alt?: string | null }>
      } | null
    } | null
  }>

  const shipping = order.shipping_address_json as {
    name?: string
    address?: { line1?: string; line2?: string; city?: string; postalCode?: string; country?: string }
  } | null

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/account/orders"
          className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300"
        >
          ← Back to orders
        </Link>
        <h1 className="text-2xl font-bold text-zinc-50">
          Order #{order.id.slice(0, 8)}
        </h1>
        <p className="mt-2 text-zinc-400">
          {new Date(order.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <span
          className={`mt-4 inline-block rounded px-2 py-1 text-sm font-medium capitalize ${
            order.status === 'paid' || order.status === 'processing'
              ? 'bg-emerald-900/50 text-emerald-400'
              : order.status === 'shipped' || order.status === 'delivered'
                ? 'bg-blue-900/50 text-blue-400'
                : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {order.status}
        </span>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-50">Items</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => {
                const variant = item.product_variants ?? null
                const product = variant?.products ?? null
                const imgs = product?.product_images ?? []
                const img = imgs[0]
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-zinc-800">
                      {img?.url ? (
                        <Image
                          src={img.url}
                          alt={img.alt ?? product?.name ?? 'Product'}
                          fill
                          className="object-cover"
                          unoptimized={img.url.includes('picsum.photos')}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${product?.slug}`}
                        className="font-medium text-zinc-50 hover:text-white"
                      >
                        {product?.name}
                      </Link>
                      {variant?.name && (
                        <p className="text-sm text-zinc-400">{variant.name}</p>
                      )}
                      {item.config && Object.keys(item.config).length > 0 && (
                        <p className="text-xs text-amber-400/90">
                          Custom: {Object.entries(item.config).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-zinc-500">
                        Qty: {item.quantity} × {formatPrice(item.price_cents)} ={' '}
                        {formatPrice(item.quantity * item.price_cents)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {shipping && (
            <section>
              <h2 className="text-lg font-semibold text-zinc-50">
                Shipping address
              </h2>
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

          <section>
            <p className="text-right text-lg font-semibold text-zinc-50">
              Total: {formatPrice(order.total_cents)}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
