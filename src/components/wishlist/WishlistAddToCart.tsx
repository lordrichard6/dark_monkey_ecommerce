'use client'

import { useState } from 'react'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'
import { addToCart } from '@/actions/cart'
import { removeFromWishlist } from '@/actions/wishlist'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Props = {
  productId: string
  productSlug: string
  productName: string
  variantId: string
  variantName: string | null
  priceCents: number
  imageUrl?: string
}

export function WishlistAddToCart({
  productId,
  productSlug,
  productName,
  variantId,
  variantName,
  priceCents,
  imageUrl,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleAddToCart() {
    setState('loading')
    try {
      await addToCart({
        variantId,
        productId,
        productSlug,
        productName,
        variantName,
        priceCents,
        imageUrl,
        quantity: 1,
      })
      setState('done')
      toast.success(`${productName} added to cart`)
      // Auto-remove from wishlist after adding to cart
      await removeFromWishlist(productId)
      router.refresh()
      setTimeout(() => setState('idle'), 2000)
    } catch {
      toast.error('Failed to add to cart')
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={state !== 'idle'}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-amber-400 disabled:opacity-70"
    >
      {state === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === 'done' && <Check className="h-3.5 w-3.5" />}
      {state === 'idle' && <ShoppingCart className="h-3.5 w-3.5" />}
      {state === 'done' ? 'Added!' : 'Add to Cart'}
    </button>
  )
}
