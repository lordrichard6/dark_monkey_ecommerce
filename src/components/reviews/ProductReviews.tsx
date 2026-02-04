'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { submitReview } from '@/actions/reviews'

export type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  reviewer_display_name: string | null
  order_id: string | null
  created_at: string
}

type Props = {
  productId: string
  productSlug: string
  reviews: ReviewRow[]
  userReview: ReviewRow | null
  canSubmit: boolean
  orderIdFromQuery?: string | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= rating ? 'text-amber-400' : 'text-zinc-600'}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  userReview,
  canSubmit,
  orderIdFromQuery,
}: Props) {
  const t = useTranslations('reviews')
  const [rating, setRating] = useState(userReview?.rating ?? 5)
  const [comment, setComment] = useState(userReview?.comment ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await submitReview(
      productId,
      rating,
      comment,
      orderIdFromQuery ?? undefined,
      productSlug
    )
    setLoading(false)
    if (result.ok) {
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setError(result.error)
    }
  }

  return (
    <section className="mt-12 border-t border-zinc-800 pt-8">
      <h2 className="text-xl font-semibold text-zinc-50">{t('title')}</h2>

      {reviews.length === 0 && !canSubmit && (
        <p className="mt-4 text-zinc-500">{t('noReviews')}</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-6">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating rating={r.rating} />
                <span className="text-sm text-zinc-400">
                  {r.reviewer_display_name ?? 'Customer'} ·{' '}
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {r.order_id && (
                <span className="mt-1 inline-block text-xs text-amber-400/90">
                  {t('verifiedPurchase')}
                </span>
              )}
              {r.comment && (
                <p className="mt-2 text-zinc-300">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {canSubmit ? (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-zinc-50">
            {userReview ? t('yourReview') : t('writeReview')}
          </h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                {t('rating')}
              </label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="rounded p-1 text-2xl transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    aria-label={`${i} stars`}
                  >
                    <span className={i <= rating ? 'text-amber-400' : 'text-zinc-600'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="review-comment" className="block text-sm font-medium text-zinc-400">
                {t('comment')}
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Share your experience with this product..."
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-sm text-emerald-400">Thank you! Your review has been saved.</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-6 text-zinc-500">
          <Link href="/login" className="text-amber-400 hover:text-amber-300">
            {t('signInToReview')}
          </Link>
        </p>
      )}
    </section>
  )
}
