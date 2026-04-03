'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCardWithWishlist } from '@/components/product/ProductCardWithWishlist'
import { makeExclusiveProductPublic } from '@/actions/custom-products'
import { toast } from 'sonner'
import { Globe, Loader2 } from 'lucide-react'

type ExclusiveProduct = {
  id: string
  slug: string
  name: string
  priceCents: number
  compareAtPriceCents: number | null
  imageUrl: string
  imageAlt: string
  imageUrl2: string | null
  dualImageMode: boolean
  isFeatured: boolean
  isInWishlist: boolean
  createdAt: string
}

function MakePublicButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await makeExclusiveProductPublic(productId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error ?? 'Something went wrong')
      setConfirming(false)
      return
    }
    toast.success('Product is now public')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-xs text-zinc-300">
        <p className="mb-2 leading-relaxed text-zinc-300">
          This product will no longer be shown exclusively to you and will be available to everyone
          else for purchase.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            Yes, make public
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
    >
      <Globe className="h-3.5 w-3.5" />
      Make public
    </button>
  )
}

export function ExclusiveProductShowcase({ products }: { products: ExclusiveProduct[] }) {
  if (products.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-zinc-50">Made for You</h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
          </svg>
          Exclusive
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-rose-500/10 bg-gradient-to-br from-rose-500/5 via-zinc-900/60 to-zinc-900/60 p-6 backdrop-blur-sm">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />

        <p className="mb-5 text-sm text-zinc-400">
          These products were crafted exclusively for you. Only you can see and purchase them.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col">
              <ProductCardWithWishlist
                productId={p.id}
                slug={p.slug}
                name={p.name}
                priceCents={p.priceCents}
                compareAtPriceCents={p.compareAtPriceCents}
                imageUrl={p.imageUrl}
                imageAlt={p.imageAlt}
                imageUrl2={p.imageUrl2}
                dualImageMode={p.dualImageMode}
                isFeatured={p.isFeatured}
                isInWishlist={p.isInWishlist}
                createdAt={p.createdAt}
                showWishlist={true}
              />
              <MakePublicButton productId={p.id} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
