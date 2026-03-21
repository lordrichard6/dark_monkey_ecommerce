'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductDualImageMode } from '@/actions/admin-products'
import { toast } from 'sonner'

type Props = {
  productId: string
  initialDualImageMode: boolean
}

export function ProductToggleDualImage({ productId, initialDualImageMode }: Props) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialDualImageMode)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const next = !enabled
    setEnabled(next) // optimistic
    setLoading(true)
    const result = await updateProductDualImageMode(productId, next)
    setLoading(false)
    if (!result.ok) {
      setEnabled(!next) // revert
      toast.error(result.error ?? 'Failed to update')
    } else {
      toast.success(next ? 'Dual image mode enabled' : 'Dual image mode disabled')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={enabled ? 'Click to show single image on card' : 'Click to show two images on card'}
      className="inline-flex cursor-pointer items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Track */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-violet-500' : 'bg-zinc-700'
        }`}
      >
        {/* Thumb */}
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium transition-colors ${enabled ? 'text-violet-400' : 'text-zinc-500'}`}
      >
        {loading ? 'Saving…' : 'Dual image'}
      </span>
    </button>
  )
}
