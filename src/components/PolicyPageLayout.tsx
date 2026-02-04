'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

type Props = {
  title: string
  children: React.ReactNode
}

export function PolicyPageLayout({ title, children }: Props) {
  const t = useTranslations('common')
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          {t('shop')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">{title}</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-zinc-50">{title}</h1>

      <div className="space-y-8 text-zinc-300">{children}</div>

      <div className="mt-12">
        <Link href="/" className="text-amber-400 hover:text-amber-300">
          ← Back to shop
        </Link>
      </div>
    </div>
  )
}
