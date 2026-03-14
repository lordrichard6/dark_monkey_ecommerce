'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateProductStatus } from '@/actions/admin-products'
import { toast } from 'sonner'

type Props = {
  productId: string
  initialIsActive: boolean
}

export function ProductToggleStatus({ productId, initialIsActive }: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [isActive, setIsActive] = useState(initialIsActive)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const next = !isActive
    setIsActive(next) // optimistic
    setLoading(true)
    const result = await updateProductStatus(productId, next)
    setLoading(false)
    if (!result.ok) {
      setIsActive(!next) // revert
      toast.error(result.error ?? t('status.failedToUpdate'))
    } else {
      toast.success(next ? t('status.productActivated') : t('status.productDeactivated'))
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isActive ? t('status.clickToDeactivate') : t('status.clickToActivate')}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
        isActive
          ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/70 ring-1 ring-emerald-500/20'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 ring-1 ring-zinc-700'
      }`}
    >
      {/* Animated dot */}
      <span className="relative flex h-2 w-2">
        {isActive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isActive ? 'bg-emerald-400' : 'bg-zinc-500'
          }`}
        />
      </span>
      {loading ? t('status.saving') : isActive ? t('status.active') : t('status.inactive')}
      {/* Toggle hint */}
      <span className={`text-[10px] ${isActive ? 'text-emerald-600' : 'text-zinc-600'}`}>
        {isActive ? t('status.deactivate') : t('status.activate')}
      </span>
    </button>
  )
}
