import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Package, Truck, ArrowLeft, MapPin } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { formatPrice, SupportedCurrency } from '@/lib/currency'

type Props = {
    params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: Props) {
    const { id } = await params
    const t = await getTranslations('account')
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch order with items and shipping address
    const { data: order } = await supabase
        .from('orders')
        .select(`
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
      ),
      shipping_address:addresses!shipping_address_id (*)
    `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!order) {
        notFound()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    // Helper to get product image
    const getProductImage = (item: any) => {
        const images = item.variant?.product?.product_images
        if (images && images.length > 0) {
            return images[0].url
        }
        return null
    }

    return (
        <div className="min-h-screen bg-black py-12">
            <div className="mx-auto max-w-4xl px-4">
                <Link
                    href="/account/orders"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('backToOrders')}
                </Link>

                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-50">Order #{order.id.slice(0, 8)}</h1>
                        <p className="mt-1 text-zinc-400">
                            Placed on {formatDate(order.created_at)}
                        </p>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border ${order.status === 'paid' || order.status === 'processing'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                        }`}>
                        {order.status === 'paid' || order.status === 'processing' ? (
                            <Package className="h-4 w-4" />
                        ) : (
                            <Truck className="h-4 w-4" />
                        )}
                        <span className="capitalize">{order.status}</span>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                            <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('items')}</h2>
                            <div className="space-y-6">
                                {order.order_items.map((item: any) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                                            {getProductImage(item) ? (
                                                <Image
                                                    src={getProductImage(item)}
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
                                                    {item.variant?.name} • Qty {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium text-zinc-100">
                                                {formatPrice(item.price_cents, order.currency as SupportedCurrency)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                            <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('total')}</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.total_cents, order.currency as SupportedCurrency)}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div className="mt-4 flex justify-between border-t border-zinc-800 pt-4 text-lg font-bold text-zinc-50">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total_cents, order.currency as SupportedCurrency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-50">
                                <MapPin className="h-5 w-5 text-zinc-400" />
                                {t('shippingAddress')}
                            </h2>
                            {order.shipping_address ? (
                                <div className="text-sm text-zinc-400 space-y-1">
                                    <p className="font-medium text-zinc-200">{order.shipping_address.full_name}</p>
                                    <p>{order.shipping_address.line1}</p>
                                    {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                                    <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                                    <p>{order.shipping_address.country}</p>
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
