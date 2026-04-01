'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  timesBought: number
  reviewCount: number
  avgRating: number | null
}

function StarIcon({ fill, index }: { fill: number; index: number }) {
  const uid = useId()
  const id = `${uid}-s${index}`
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" className="shrink-0">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#fbbf24" />
          <stop offset={`${fill * 100}%`} stopColor="#52525b" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

export function ProductCardStats({ timesBought, reviewCount, avgRating }: Props) {
  const t = useTranslations('product')
  const hasAny = timesBought > 0 || reviewCount > 0 || avgRating !== null

  if (!hasAny) {
    return (
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} width="9" height="9" viewBox="0 0 24 24" className="shrink-0 opacity-20">
            <path
              fill="#fbbf24"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        ))}
        <span className="ml-1 whitespace-nowrap text-[10px] font-medium tracking-wide text-zinc-600 uppercase">
          {t('noReviewsYet')}
        </span>
      </div>
    )
  }

  const rating = avgRating !== null ? Math.round(avgRating * 10) / 10 : null

  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
      {/* Star rating */}
      {rating !== null && (
        <>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} index={s} fill={Math.min(1, Math.max(0, rating - (s - 1)))} />
            ))}
          </div>
          <span className="font-semibold text-amber-400 tabular-nums">{rating.toFixed(1)}</span>
        </>
      )}

      {/* Review count: star icon + number */}
      {reviewCount > 0 && (
        <>
          {rating !== null && <span className="text-zinc-700">·</span>}
          <span className="flex items-center gap-0.5 tabular-nums text-zinc-500">
            <svg width="9" height="9" viewBox="0 0 24 24" className="shrink-0" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {reviewCount > 99 ? '99+' : reviewCount}
          </span>
        </>
      )}

      {/* Sales count: bag icon + number */}
      {timesBought > 0 && (
        <>
          {(rating !== null || reviewCount > 0) && <span className="text-zinc-700">·</span>}
          <span className="flex items-center gap-0.5 tabular-nums text-zinc-500">
            <BagIcon />
            {timesBought > 999 ? `${Math.floor(timesBought / 1000)}k` : timesBought}
          </span>
        </>
      )}
    </div>
  )
}
