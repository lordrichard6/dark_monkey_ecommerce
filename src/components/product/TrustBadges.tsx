'use client'

import { Truck, RotateCcw, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TrustBadges() {
  const t = useTranslations('product')

  const badges = [
    {
      icon: Truck,
      label: t('freeShipping'),
    },
    {
      icon: RotateCcw,
      label: t('thirtyDayReturns'),
    },
    {
      icon: ShieldCheck,
      label: t('oneYearWarranty'),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 py-6 border-y border-white/5 sm:grid-cols-3">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900/50 text-zinc-400 border border-white/5">
            <badge.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400/80 leading-tight">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  )
}
