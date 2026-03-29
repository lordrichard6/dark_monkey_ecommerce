'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductFeatured } from '@/actions/admin-products'
import { toast } from 'sonner'

type Props = {
  productId: string
  initialIsFeatured: boolean
}

export function ProductToggleFeatured({ productId, initialIsFeatured }: Props) {
  const router = useRouter()
  const [featured, setFeatured] = useState(initialIsFeatured)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const next = !featured
    setFeatured(next) // optimistic
    setLoading(true)
    const result = await updateProductFeatured(productId, next)
    setLoading(false)
    if (!result.ok) {
      setFeatured(!next) // revert
      toast.error(result.error ?? 'Failed to update')
    } else {
      toast.success(next ? 'Product featured on landing page' : 'Product removed from featured')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={featured ? 'Click to remove from featured' : 'Click to feature on landing page'}
      className="inline-flex cursor-pointer items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Track */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
          featured ? 'bg-amber-500' : 'bg-zinc-700'
        }`}
      >
        {/* Thumb */}
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            featured ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium transition-colors ${featured ? 'text-amber-400' : 'text-zinc-500'}`}
      >
        {loading ? 'Saving…' : 'Featured'}
      </span>
    </button>
  )
}
