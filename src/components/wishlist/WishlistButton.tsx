'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toggleWishlist } from '@/actions/wishlist'

type Props = {
  productId: string
  productSlug?: string
  isInWishlist: boolean
  variant?: 'icon' | 'button'
  className?: string
}

export function WishlistButton({
  productId,
  productSlug,
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
      router.refresh()
    } else if (result.error === 'Sign in to save items') {
      router.push(`/login?redirectTo=${productSlug ? `/products/${productSlug}` : '/'}`)
    }
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium transition hover:border-zinc-600 disabled:opacity-50 ${
          inWishlist
            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
            : 'text-zinc-400 hover:text-zinc-300'
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
