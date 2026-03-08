import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductImageWithFallback } from '@/components/product/ProductImageWithFallback'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { WishlistAddToCart } from '@/components/wishlist/WishlistAddToCart'
import { ShareWishlistToggle } from '@/components/wishlist/ShareWishlistToggle'
import { Price } from '@/components/currency/Price'
import { Heart, ShoppingBag, Tag } from 'lucide-react'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default async function WishlistPage() {
  const t = await getTranslations('account')
  const supabase = await createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    //
  }

  if (!user) redirect('/login?redirectTo=/account/wishlist')

  // Fetch wishlist + profile (for is_public) in parallel
  const [{ data: wishlist }, { data: profile }] = await Promise.all([
    supabase
      .from('user_wishlist')
      .select(
        `
        product_id,
        created_at,
        products (
          id,
          name,
          slug,
          product_images (url, alt),
          product_variants (
            id,
            name,
            price_cents,
            compare_at_price_cents
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('is_public').eq('id', user.id).single(),
  ])

  const items = (wishlist ?? []).filter(
    (w): w is typeof w & { products: NonNullable<typeof w.products> } => w.products != null
  )

  const isPublic = profile?.is_public ?? false

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/account"
              className="mb-2 inline-block text-sm text-zinc-400 hover:text-zinc-300"
            >
              {t('backToAccount')}
            </Link>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
              {t('wishlist')}
              {items.length > 0 && (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-400">
                  {items.length}
                </span>
              )}
            </h1>
          </div>
          {/* Share button — only when there are items */}
          {items.length > 0 && <ShareWishlistToggle userId={user.id} initialIsPublic={isPublic} />}
        </div>

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-8 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
              <Heart className="h-8 w-8 text-zinc-700" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-300">{t('yourWishlistEmpty')}</h2>
            <p className="mt-1 max-w-xs text-sm text-zinc-600">
              Save items you love and come back to them anytime. Perfect for gifting hints too.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              <ShoppingBag className="h-4 w-4" />
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const raw = item.products
              const p = (Array.isArray(raw) ? raw[0] : raw) as {
                id: string
                name: string
                slug: string
                product_images?: Array<{ url: string; alt: string | null }>
                product_variants?: Array<{
                  id: string
                  name: string | null
                  price_cents: number
                  compare_at_price_cents: number | null
                }>
              }

              const img = p.product_images?.[0]
              const variants = p.product_variants ?? []

              // Find cheapest variant
              const cheapestVariant = variants.reduce(
                (min, v) => (!min || v.price_cents < min.price_cents ? v : min),
                variants[0] ?? null
              )

              const minPrice = cheapestVariant?.price_cents ?? 0
              const comparePrice = cheapestVariant?.compare_at_price_cents ?? null
              const isOnSale = comparePrice != null && comparePrice > minPrice
              const savedPct = isOnSale
                ? Math.round(((comparePrice - minPrice) / comparePrice) * 100)
                : 0

              const addedAgo = timeAgo(item.created_at)

              return (
                <div
                  key={item.product_id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition hover:border-zinc-700"
                >
                  {/* Sale badge */}
                  {isOnSale && (
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                      <Tag className="h-3 w-3" />-{savedPct}%
                    </div>
                  )}

                  {/* Image */}
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
                      <ProductImageWithFallback
                        src={img?.url ?? '/next.svg'}
                        alt={img?.alt ?? p.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 50vw, 33vw"
                        unoptimized={
                          img?.url?.includes('picsum.photos') ||
                          img?.url?.includes('/storage/') ||
                          img?.url?.includes('product-images')
                        }
                      />
                    </div>
                  </Link>

                  {/* Wishlist heart */}
                  <WishlistButton
                    productId={p.id}
                    productSlug={p.slug}
                    isInWishlist
                    variant="icon"
                  />

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/products/${p.slug}`}>
                      <h3 className="font-medium text-zinc-50 group-hover:text-white line-clamp-2">
                        {p.name}
                      </h3>
                    </Link>

                    {/* Price row */}
                    <div className="mt-1 flex items-baseline gap-2">
                      <Price cents={minPrice} className="text-sm font-semibold text-zinc-100" />
                      {isOnSale && comparePrice && (
                        <Price
                          cents={comparePrice}
                          className="text-xs text-zinc-600 line-through"
                        />
                      )}
                    </div>

                    {/* Added ago */}
                    <p className="mt-1 text-xs text-zinc-600" suppressHydrationWarning>
                      Saved {addedAgo}
                    </p>

                    {/* Actions */}
                    <div className="mt-3 flex flex-col gap-2">
                      {cheapestVariant ? (
                        <WishlistAddToCart
                          productId={p.id}
                          productSlug={p.slug}
                          productName={p.name}
                          variantId={cheapestVariant.id}
                          variantName={cheapestVariant.name}
                          priceCents={cheapestVariant.price_cents}
                          imageUrl={img?.url}
                        />
                      ) : null}
                      <Link
                        href={`/products/${p.slug}`}
                        className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-400"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
