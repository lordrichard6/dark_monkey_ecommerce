import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductImageWithFallback } from '@/components/product/ProductImageWithFallback'
import { redirect } from 'next/navigation'
import { WishlistButton } from '@/components/wishlist/WishlistButton'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function WishlistPage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    //
  }

  if (!user) redirect('/login?redirectTo=/account/wishlist')

  const { data: wishlist } = await supabase
    .from('user_wishlist')
    .select(
      `
      product_id,
      products (
        id,
        name,
        slug,
        product_images (url, alt),
        product_variants (price_cents)
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (wishlist ?? []).filter(
    (w): w is typeof w & { products: NonNullable<typeof w.products> } =>
      w.products != null
  )

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold text-zinc-50">Wishlist</h1>

        {items.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-12 text-center">
            <p className="text-zinc-400">Your wishlist is empty.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-amber-400 hover:text-amber-300"
            >
              Browse products →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const raw = item.products
              const p = (Array.isArray(raw) ? raw[0] : raw) as {
                id: string
                name: string
                slug: string
                product_images?: Array<{ url: string; alt: string | null }>
                product_variants?: Array<{ price_cents: number }>
              }
              const img = p.product_images?.[0]
              const minPrice = p.product_variants?.length
                ? Math.min(...p.product_variants.map((v) => v.price_cents))
                : 0
              return (
                <div
                  key={item.product_id}
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition hover:border-zinc-700"
                >
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
                    <div className="p-4">
                      <h3 className="font-medium text-zinc-50 group-hover:text-white">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatPrice(minPrice)}
                      </p>
                    </div>
                  </Link>
                  <WishlistButton
                    productId={p.id}
                    productSlug={p.slug}
                    isInWishlist
                    variant="icon"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
