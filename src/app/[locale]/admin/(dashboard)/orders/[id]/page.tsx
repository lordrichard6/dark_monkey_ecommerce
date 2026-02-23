import Link from 'next/link'
import Image from 'next/image'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { CopyIdButton } from '@/components/admin/CopyIdButton'
import { getAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { UpdateOrderStatusForm } from './update-order-status-form'
import { RefundOrderButton } from './refund-order-button'
import { SyncPrintfulOrderButton } from './sync-printful-order-button'
import { ConfirmPrintfulOrderButton } from './confirm-printful-order-button'
import { fetchStoreOrder } from '@/lib/printful'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  pending: {
    badge: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700',
    dot: 'bg-zinc-400',
    label: 'Pending',
  },
  paid: {
    badge: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
    dot: 'bg-blue-400',
    label: 'Paid',
  },
  processing: {
    badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Processing',
  },
  shipped: {
    badge: 'bg-purple-500/15 text-purple-300 ring-purple-500/30',
    dot: 'bg-purple-400',
    label: 'Shipped',
  },
  delivered: {
    badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Delivered',
  },
  cancelled: {
    badge: 'bg-red-500/15 text-red-300 ring-red-500/30',
    dot: 'bg-red-400',
    label: 'Cancelled',
  },
  refunded: {
    badge: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Refunded',
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Status progression ────────────────────────────────────────────────────────
const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const
type StatusStep = (typeof STATUS_STEPS)[number]

function StatusTimeline({ status }: { status: string }) {
  const isCancelled = status === 'cancelled' || status === 'refunded'
  const currentIdx = STATUS_STEPS.indexOf(status as StatusStep)

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
        <svg
          className="h-4 w-4 shrink-0 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
        </svg>
        <span className="text-sm font-medium text-red-300 capitalize">{status}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {STATUS_STEPS.map((step, idx) => {
        const done = currentIdx > idx
        const active = currentIdx === idx
        const cfg = STATUS_CONFIG[step]
        return (
          <div key={step} className="flex items-center gap-1">
            {idx > 0 && (
              <div
                className={`h-px w-6 shrink-0 rounded ${done || active ? 'bg-zinc-500' : 'bg-zinc-800'}`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset transition-all
              ${active ? cfg.badge + ' scale-105' : done ? 'bg-zinc-800/60 text-zinc-500 ring-zinc-800' : 'bg-zinc-900 text-zinc-700 ring-zinc-800/50'}`}
            >
              {done && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {active && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
              {cfg.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
          {icon}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {children}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
type Props = { params: Promise<{ id: string }> }

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

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
      printful_order_id,
      tracking_number,
      tracking_url,
      carrier,
      discount_id,
      discount_cents,
      created_at,
      updated_at,
      shipping_address_json,
      discounts (code, type, value_cents),
      order_items (
        id,
        quantity,
        price_cents,
        config,
        product_variants (
          id,
          name,
          sku,
          attributes,
          products (id, name, slug, product_images (url, sort_order))
        )
      )
    `
    )
    .eq('id', id)
    .single()

  if (!order) notFound()

  // ── Type helpers ──
  const items = (order.order_items ?? []) as Array<{
    id: string
    quantity: number
    price_cents: number
    config?: Record<string, unknown>
    product_variants?: {
      id?: string
      name?: string
      sku?: string
      attributes?: Record<string, unknown> | null
      products?: {
        id?: string
        name?: string
        slug?: string
        product_images?: Array<{ url: string; sort_order?: number | null }>
      } | null
    } | null
  }>

  const shipping = order.shipping_address_json as {
    name?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      postalCode?: string
      country?: string
    }
  } | null

  const discount = Array.isArray(order.discounts)
    ? order.discounts[0]
    : (order.discounts as {
        code?: string
        type?: string
        value_cents?: number
      } | null)

  // Fetch Printful order status (non-blocking — we don't throw if this fails)
  // Used to decide whether to show "Confirm with Printful" vs "Sync Printful"
  let printfulStatus: string | null = null
  if (order.printful_order_id) {
    const { ok: pfOk, order: pfOrder } = await fetchStoreOrder(order.printful_order_id)
    if (pfOk && pfOrder?.status) {
      printfulStatus = pfOrder.status
    }
  }
  const printfulIsDraft = printfulStatus === 'draft'

  // Determine if updated_at is meaningfully different from created_at (>5s diff)
  const createdMs = new Date(order.created_at).getTime()
  const updatedMs = order.updated_at ? new Date(order.updated_at).getTime() : createdMs
  const wasUpdated = Math.abs(updatedMs - createdMs) > 5000

  // Sort items
  const sortedItems = items.map((item) => {
    const images = (item.product_variants?.products?.product_images ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
    return { ...item, firstImage: images[0] ?? null }
  })

  const subtotal = sortedItems.reduce((sum, i) => sum + i.quantity * i.price_cents, 0)
  const hasDiscount = (order.discount_cents ?? 0) > 0
  const hasTracking = order.tracking_number || order.tracking_url
  const itemCount = sortedItems.reduce((sum, i) => sum + i.quantity, 0)

  // Build variant label from attributes
  function variantLabel(item: (typeof sortedItems)[number]) {
    const attrs = item.product_variants?.attributes
    if (!attrs || Object.keys(attrs).length === 0) return item.product_variants?.name ?? null
    return Object.entries(attrs)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
      .join(' · ')
  }

  // Truncate long IDs for display
  function truncateId(str: string, chars = 24) {
    return str.length > chars ? str.slice(0, chars) + '…' : str
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-950 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* ── Top nav ── */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Orders
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="font-mono text-zinc-400">#{order.id.slice(0, 8)}</span>
        </div>

        {/* ── Hero card ── */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {/* Status color bar */}
          <div
            className={`h-1 w-full ${
              order.status === 'delivered'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-500'
                : order.status === 'shipped'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-500'
                  : order.status === 'paid'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-500'
                    : order.status === 'processing'
                      ? 'bg-gradient-to-r from-amber-700 to-amber-500'
                      : order.status === 'cancelled' || order.status === 'refunded'
                        ? 'bg-gradient-to-r from-red-900 to-red-700'
                        : 'bg-gradient-to-r from-zinc-800 to-zinc-700'
            }`}
          />

          <div className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: ID + status + meta */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
                    Order <span className="font-mono">#{order.id.slice(0, 8)}</span>
                  </h1>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <CopyIdButton id={order.id} label="order ID" />
                  <span className="text-zinc-700">·</span>
                  <span>Placed {formatDateTime(order.created_at)}</span>
                  {wasUpdated && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-600">
                        Updated {formatDateTime(order.updated_at)}
                      </span>
                    </>
                  )}
                </div>

                {order.guest_email && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-3.5 w-3.5 text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    <span className="text-sm text-zinc-300">{order.guest_email}</span>
                  </div>
                )}

                {/* Status timeline */}
                <div className="pt-1">
                  <StatusTimeline status={order.status} />
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <UpdateOrderStatusForm orderId={order.id} currentStatus={order.status} />
                <div className="flex flex-wrap items-center gap-2">
                  {order.printful_order_id && printfulIsDraft && (
                    <ConfirmPrintfulOrderButton orderId={order.id} />
                  )}
                  {order.printful_order_id && !printfulIsDraft && (
                    <SyncPrintfulOrderButton orderId={order.id} />
                  )}
                  {order.stripe_session_id &&
                    ['paid', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                      <RefundOrderButton orderId={order.id} />
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reference IDs strip ── */}
        {(order.stripe_session_id || order.printful_order_id) && (
          <div className="flex flex-wrap gap-3">
            {order.stripe_session_id && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 min-w-0">
                {/* Stripe icon */}
                <svg
                  className="h-4 w-4 shrink-0 text-[#635bff]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.929 3.445 1.718 3.445 2.745 0 1.02-.87 1.612-2.397 1.612-1.86 0-4.703-.907-6.656-2.124l-.9 5.498c1.743 1.029 4.55 1.832 7.517 1.832 2.616 0 4.714-.613 6.197-1.82 1.577-1.285 2.373-3.166 2.373-5.463 0-3.997-2.41-5.732-6.836-7.566z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Stripe session
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p
                      className="font-mono text-xs text-zinc-400 truncate max-w-[220px]"
                      title={order.stripe_session_id}
                    >
                      {truncateId(order.stripe_session_id, 28)}
                    </p>
                    <CopyIdButton id={order.stripe_session_id} label="Stripe session ID" />
                  </div>
                </div>
                <a
                  href={`https://dashboard.stripe.com/test/checkout/sessions/${order.stripe_session_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Stripe Dashboard"
                  className="ml-auto shrink-0 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}

            {order.printful_order_id && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <svg
                  className="h-4 w-4 shrink-0 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                  />
                </svg>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Printful order
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="font-mono text-xs text-zinc-400">#{order.printful_order_id}</p>
                    {printfulStatus && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset capitalize ${
                          printfulStatus === 'draft'
                            ? 'bg-zinc-800 text-zinc-400 ring-zinc-700'
                            : printfulStatus === 'pending'
                              ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                              : printfulStatus === 'inprocess'
                                ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                                : printfulStatus === 'partial'
                                  ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                                  : printfulStatus === 'fulfilled'
                                    ? 'bg-purple-500/10 text-purple-400 ring-purple-500/20'
                                    : printfulStatus === 'canceled'
                                      ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                                      : printfulStatus === 'failed'
                                        ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                                        : printfulStatus === 'onhold'
                                          ? 'bg-orange-500/10 text-orange-400 ring-orange-500/20'
                                          : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
                        }`}
                      >
                        {printfulStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── Left: Items (wider) ── */}
          <div className="lg:col-span-3 space-y-6">
            <SectionCard
              title={`Items · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              icon={
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
            >
              <div className="divide-y divide-zinc-800/60">
                {sortedItems.map((item) => {
                  const product = item.product_variants?.products ?? null
                  const img = item.firstImage
                  const label = variantLabel(item)

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 hover:bg-zinc-800/20 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-zinc-700/50">
                        {img?.url ? (
                          <Image
                            src={img.url}
                            alt={product?.name ?? ''}
                            fill
                            className="object-cover"
                            unoptimized={img.url.includes('picsum.photos')}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-700">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="m3 9 5-5 4 4 4-4 5 5" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        {product?.slug ? (
                          <Link
                            href={`/admin/products/${product.slug}`}
                            className="text-sm font-semibold text-zinc-100 hover:text-amber-400 transition-colors line-clamp-2"
                          >
                            {product?.name}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-zinc-100 line-clamp-2">
                            {product?.name ?? '—'}
                          </p>
                        )}
                        {label && <p className="mt-0.5 text-xs text-zinc-500">{label}</p>}
                        {item.product_variants?.sku && (
                          <p className="mt-0.5 font-mono text-[10px] text-zinc-700">
                            SKU: {item.product_variants.sku}
                          </p>
                        )}
                        {item.config && Object.keys(item.config).length > 0 && (
                          <p className="mt-0.5 text-xs text-amber-400/80">
                            Custom:{' '}
                            {Object.entries(item.config)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Qty + price */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-zinc-100">
                          {formatPrice(item.quantity * item.price_cents)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600">
                          {item.quantity} × {formatPrice(item.price_cents)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-zinc-800 bg-zinc-900/80 px-5 py-4 space-y-2">
                {subtotal !== order.total_cents && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-400">{formatPrice(subtotal)}</span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-zinc-500">
                      Discount
                      {discount?.code && (
                        <span className="rounded border border-emerald-800/60 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                          {discount.code}
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-emerald-400">
                      −{formatPrice(order.discount_cents!)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-200">Total</span>
                  <span className="text-xl font-bold text-zinc-50">
                    {formatPrice(order.total_cents)}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── Right: Shipping + Tracking ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping address */}
            {shipping && (
              <SectionCard
                title="Shipping"
                icon={
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              >
                <div className="p-4 space-y-1">
                  {shipping.name && (
                    <p className="text-sm font-semibold text-zinc-200">{shipping.name}</p>
                  )}
                  {shipping.address && (
                    <>
                      {shipping.address.line1 && (
                        <p className="text-sm text-zinc-400">{shipping.address.line1}</p>
                      )}
                      {shipping.address.line2 && (
                        <p className="text-sm text-zinc-400">{shipping.address.line2}</p>
                      )}
                      <p className="text-sm text-zinc-400">
                        {[shipping.address.city, shipping.address.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {shipping.address.country && (
                        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider pt-1">
                          {shipping.address.country}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Tracking */}
            <SectionCard
              title="Tracking"
              icon={
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2v-2"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 6h4l4 6v5" />
                </svg>
              }
            >
              {hasTracking ? (
                <div className="p-4 space-y-3">
                  {order.carrier && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                        Carrier
                      </span>
                      <span className="text-sm font-semibold text-zinc-200">{order.carrier}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                        Tracking number
                      </span>
                      <p className="font-mono text-sm text-zinc-300 break-all">
                        {order.tracking_number}
                      </p>
                    </div>
                  )}
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-700/40 bg-purple-900/20 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-900/40 transition-colors"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Track shipment
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-zinc-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                  <p className="mt-2 text-xs text-zinc-600">
                    {order.printful_order_id
                      ? 'No tracking yet. Sync with Printful to check.'
                      : 'No tracking information available.'}
                  </p>
                  {order.printful_order_id && (
                    <div className="mt-3 flex justify-center">
                      <SyncPrintfulOrderButton orderId={order.id} />
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
