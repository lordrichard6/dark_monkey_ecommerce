import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Package, Truck, MapPin, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { formatPrice, SupportedCurrency } from '@/lib/currency'

type Props = {
  params: Promise<{ id: string; locale: string }>
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color: 'text-zinc-400',
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
    icon: Circle,
  },
  paid: {
    label: 'Paid',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  processing: {
    label: 'Processing',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: Circle,
  },
  refunded: {
    label: 'Refunded',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: Circle,
  },
}

const TIMELINE_STEPS = ['paid', 'processing', 'shipped', 'delivered'] as const

export default async function OrderDetailsPage({ params }: Props) {
  const { id } = await params
  const t = await getTranslations('account')
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        variant:product_variants (
          *,
          product:products (
            name,
            slug,
            product_images (url)
          )
        )
      )
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    notFound()
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const getProductImage = (item: {
    variant?: {
      name?: string | null
      product?: {
        name?: string | null
        slug?: string | null
        product_images?: { url: string; sort_order: number }[] | null
      } | null
    } | null
  }) => {
    const images = item.variant?.product?.product_images
    return images && images.length > 0 ? images[0].url : null
  }

  // Resolve shipping address: linked row first, then JSON fallback
  const shippingAddr = order.shipping_address ?? order.shipping_address_json ?? null

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
  const StatusIcon = statusCfg.icon

  // Timeline: which step index is current
  const currentStepIdx = TIMELINE_STEPS.indexOf(order.status as (typeof TIMELINE_STEPS)[number])
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded'

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/account/orders"
          className="mb-8 inline-block text-sm text-zinc-400 hover:text-zinc-300"
        >
          {t('backToOrders')}
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Order #{order.id.slice(0, 8)}</h1>
            <p className="mt-1 text-zinc-400" suppressHydrationWarning>
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            <span className="capitalize">{statusCfg.label}</span>
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = currentStepIdx >= idx
                const isLast = idx === TIMELINE_STEPS.length - 1
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          done
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-600'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-xs font-medium capitalize ${done ? 'text-amber-400' : 'text-zinc-600'}`}
                      >
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`mx-2 h-0.5 flex-1 transition-all ${
                          currentStepIdx > idx ? 'bg-amber-500/60' : 'bg-zinc-800'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {order.tracking_number && (
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
            <Truck className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
            <div className="flex-1">
              <p className="font-medium text-purple-300">Your order is on the way</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-purple-400">
                {order.tracking_carrier && <span>{order.tracking_carrier}</span>}
                <span className="font-mono">{order.tracking_number}</span>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    Track package <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('items')}</h2>
              <div className="space-y-6">
                {order.order_items.map(
                  (item: {
                    id: string
                    quantity: number
                    price_cents: number
                    variant_name: string | null
                    product_name: string | null
                    config?: Record<string, string> | null
                    variant?: {
                      name?: string | null
                      product?: {
                        name?: string | null
                        slug?: string | null
                        product_images?: { url: string; sort_order: number }[] | null
                      } | null
                    } | null
                  }) => {
                    const config = item.config as Record<string, string> | null
                    const configEntries = config ? Object.entries(config) : []
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                          {getProductImage(item) ? (
                            <Image
                              src={getProductImage(item)!}
                              alt={item.variant?.product?.name || 'Product'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-700">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/products/${item.variant?.product?.slug}`}
                              className="font-medium text-zinc-200 hover:text-amber-500 hover:underline"
                            >
                              {item.variant?.product?.name}
                            </Link>
                            <p className="text-sm text-zinc-500">
                              {item.variant?.name} &bull; Qty {item.quantity}
                            </p>
                            {/* Variant config pills (size, color, etc.) */}
                            {configEntries.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {configEntries.map(([key, val]) => (
                                  <span
                                    key={key}
                                    className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                                  >
                                    {key}: {val}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-zinc-100" suppressHydrationWarning>
                            {formatPrice(item.price_cents, order.currency as SupportedCurrency)}
                          </p>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('total')}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span suppressHydrationWarning>
                    {formatPrice(
                      order.subtotal_cents ?? order.total_cents,
                      order.currency as SupportedCurrency
                    )}
                  </span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span suppressHydrationWarning>
                      -{formatPrice(order.discount_cents, order.currency as SupportedCurrency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="mt-4 flex justify-between border-t border-zinc-800 pt-4 text-lg font-bold text-zinc-50">
                  <span>Total</span>
                  <span suppressHydrationWarning>
                    {formatPrice(order.total_cents, order.currency as SupportedCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-50">
                <MapPin className="h-5 w-5 text-zinc-400" />
                {t('shippingAddress')}
              </h2>
              {shippingAddr ? (
                <div className="text-sm text-zinc-400 space-y-1">
                  <p className="font-medium text-zinc-200">
                    {shippingAddr.full_name ?? shippingAddr.name ?? ''}
                  </p>
                  <p>{shippingAddr.line1 ?? shippingAddr.address_line1 ?? ''}</p>
                  {(shippingAddr.line2 ?? shippingAddr.address_line2) && (
                    <p>{shippingAddr.line2 ?? shippingAddr.address_line2}</p>
                  )}
                  <p>
                    {shippingAddr.postal_code ?? shippingAddr.zip ?? ''} {shippingAddr.city ?? ''}
                  </p>
                  <p>{shippingAddr.country ?? shippingAddr.country_code ?? ''}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No shipping address recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
