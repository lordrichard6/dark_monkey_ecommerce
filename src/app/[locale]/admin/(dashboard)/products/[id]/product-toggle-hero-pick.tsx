'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductHeroPick } from '@/actions/admin-products'
import { toast } from 'sonner'

type Props = {
  productId: string
  initialIsHeroPick: boolean
}

/**
 * Hero pick toggle — admin can promote up to 2 products to the homepage hero
 * lookbook. If 2 are already picked, toggling on a 3rd auto-drops the oldest.
 * Mirrors the visual language of `ProductToggleFeatured` for consistency.
 */
export function ProductToggleHeroPick({ productId, initialIsHeroPick }: Props) {
  const router = useRouter()
  const [heroPick, setHeroPick] = useState(initialIsHeroPick)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const next = !heroPick
    setHeroPick(next) // optimistic
    setLoading(true)
    const result = await updateProductHeroPick(productId, next)
    setLoading(false)
    if (!result.ok) {
      setHeroPick(!next) // revert
      toast.error(result.error ?? 'Failed to update')
      return
    }
    if (next && result.replacedId) {
      toast.success('Added to hero — replaced an older pick (max 2)')
    } else {
      toast.success(next ? 'Now showing in homepage hero' : 'Removed from homepage hero')
    }
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={heroPick ? 'Click to remove from hero' : 'Click to feature in homepage hero (max 2)'}
      className="inline-flex cursor-pointer items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
          heroPick ? 'bg-pink-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            heroPick ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium transition-colors ${heroPick ? 'text-pink-400' : 'text-zinc-500'}`}
      >
        {loading ? 'Saving…' : 'Hero pick'}
      </span>
    </button>
  )
}
