'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toggleWishlist } from '@/actions/wishlist'
import { trackWishlistAdd, trackWishlistRemove } from '@/lib/analytics'
import { toast } from 'sonner'

type Props = {
  productId: string
  productSlug?: string
  productName?: string
  productPrice?: number
  productCurrency?: string
  isInWishlist: boolean
  variant?: 'icon' | 'button'
  className?: string
}

export function WishlistButton({
  productId,
  productSlug,
  productName,
  productPrice,
  productCurrency = 'CHF',
  isInWishlist,
  variant = 'icon',
  className = '',
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [inWishlist, setInWishlist] = useState(isInWishlist)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    const result = await toggleWishlist(productId, inWishlist)
    setLoading(false)
    if (result.ok) {
      setInWishlist(result.inWishlist)

      // Track analytics
      if (result.inWishlist && productName && productPrice) {
        trackWishlistAdd({
          id: productId,
          name: productName,
          price: productPrice,
          currency: productCurrency,
        })
      } else if (!result.inWishlist) {
        trackWishlistRemove(productId)
      }

      router.refresh()
    } else if (result.error === 'Sign in to save items') {
      toast.info('Sign in to save items to your wishlist', {
        action: {
          label: 'Sign in',
          onClick: () =>
            router.push(`/login?redirectTo=${productSlug ? `/products/${productSlug}` : '/'}`),
        },
        duration: 4000,
      })
    }
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`group inline-flex h-13 items-center gap-2.5 rounded-full border py-2 pl-7 pr-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 ${
          inWishlist
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-amber-500/60'
            : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
        } ${className}`}
      >
        <HeartIcon filled={inWishlist} />
        {inWishlist ? 'Saved' : 'Save for later'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50 ${
        inWishlist ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
      } ${className}`}
    >
      <HeartIcon filled={inWishlist} />
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
