'use client'

import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Review {
  rating: number
}

interface ProductRatingSummaryProps {
  reviews: Review[]
}

export function ProductRatingSummary({ reviews }: ProductRatingSummaryProps) {
  const t = useTranslations('product')

  const count = reviews.length
  const average = count > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / count : 0

  if (count === 0) return null

  return (
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${
              s <= Math.round(average) ? 'fill-amber-500 text-amber-500' : 'text-zinc-600'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-zinc-300">{average.toFixed(1)}</span>
      <span className="text-zinc-500 mx-1">|</span>
      <button
        onClick={() => {
          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })
        }}
        className="text-sm font-medium text-zinc-400 underline underline-offset-4 hover:text-amber-400 transition-colors"
      >
        {count} {t('reviewsCount')}
      </button>
    </div>
  )
}
