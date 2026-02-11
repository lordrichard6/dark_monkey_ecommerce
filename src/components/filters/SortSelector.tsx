'use client'

import { useTranslations } from 'next-intl'
import { SortOption } from '@/lib/product-filtering'
import { ArrowUpDown } from 'lucide-react'

type Props = {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortSelector({ value, onChange }: Props) {
  const t = useTranslations('filters')

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'newest', label: t('newest') },
    { value: 'price-asc', label: t('priceAsc') },
    { value: 'price-desc', label: t('priceDesc') },
    { value: 'bestseller', label: t('bestseller') },
    { value: 'rating', label: t('rating') },
  ]

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-zinc-500" />
      <label htmlFor="sort" className="text-sm text-zinc-400">
        {t('sortBy')}:
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition-colors hover:border-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
