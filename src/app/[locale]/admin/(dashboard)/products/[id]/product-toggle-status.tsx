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
      className="inline-flex cursor-pointer items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Track */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
          isActive ? 'bg-emerald-500' : 'bg-zinc-700'
        }`}
      >
        {/* Thumb */}
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}
      >
        {loading ? t('status.saving') : isActive ? t('status.active') : t('status.inactive')}
      </span>
    </button>
  )
}
