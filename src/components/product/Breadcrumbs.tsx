'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface BreadcrumbsProps {
  category?: string
  productName: string
}

export function Breadcrumbs({ category, productName }: BreadcrumbsProps) {
  const t = useTranslations('common')

  return (
    <nav className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 overflow-x-auto scrollbar-hide whitespace-nowrap">
      <Link href="/" className="flex items-center hover:text-zinc-300 transition-colors">
        {t('home')}
      </Link>

      <ChevronRight className="h-3 w-3 shrink-0 opacity-30" />

      {category && (
        <>
          <Link
            href={`/products?category=${encodeURIComponent(category)}`}
            className="hover:text-zinc-300 transition-colors"
          >
            {category}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-30" />
        </>
      )}

      <span className="text-zinc-300 truncate font-bold">{productName}</span>
    </nav>
  )
}
