'use client'

import { useState } from 'react'
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
  const [showDistribution, setShowDistribution] = useState(false)

  const count = reviews.length
  const average = count > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / count : 0

  if (count === 0) return null

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: Math.round((reviews.filter((r) => r.rating === star).length / count) * 100),
  }))

  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5">
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
        <button
          onClick={() => setShowDistribution((v) => !v)}
          className="ml-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Show rating breakdown"
        >
          {showDistribution ? '▲' : '▼'}
        </button>
      </div>

      {showDistribution && (
        <div className="mt-2 space-y-1">
          {distribution.map(({ star, count: c, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-xs text-zinc-400 text-right">{star}</span>
              <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-5 text-xs text-zinc-500 text-right">{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
