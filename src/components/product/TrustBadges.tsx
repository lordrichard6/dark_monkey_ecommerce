'use client'

import { Truck, Lock, Package, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TrustBadges() {
  const t = useTranslations('product')

  const badges = [
    { icon: Truck, label: t('freeShippingThreshold') },
    { icon: Lock, label: t('securePayment') },
    { icon: Package, label: t('madeToOrder') },
    { icon: ShieldCheck, label: t('printQualityGuarantee') },
  ]

  return (
    <div className="grid grid-cols-2 gap-px sm:grid-cols-4 rounded-2xl overflow-hidden bg-white/[0.05] border border-white/5">
      {badges.map((badge, i) => (
        <div key={i} className="flex flex-col gap-3 bg-zinc-950 p-5">
          <badge.icon className="h-4 w-4 text-amber-500/80" strokeWidth={1.5} />
          <span className="text-[11px] font-medium leading-snug text-zinc-400">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}
