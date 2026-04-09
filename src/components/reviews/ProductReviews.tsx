'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { submitReview } from '@/actions/reviews'
import { PhotoUpload } from '@/components/product/PhotoUpload'
import type { PhotoUploadResult } from '@/lib/review-photos'
import Image from 'next/image'

export type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  reviewer_display_name: string | null
  order_id: string | null
  created_at: string
  photos: string[]
  user_id: string
  avatar_url: string | null
}

type Props = {
  productId: string
  productSlug: string
  reviews: ReviewRow[]
  userReview: ReviewRow | null
  canSubmit: boolean
  orderIdFromQuery?: string | null
  userId?: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? 'text-amber-400' : 'text-zinc-600'} aria-hidden>
          ★
        </span>
      ))}
    </div>
  )
}

function ReviewerAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string | null
  avatarUrl: string | null
}) {
  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return 'C'
  }

  if (avatarUrl) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-900 flex-shrink-0">
        <Image
          src={avatarUrl}
          alt={displayName || 'Reviewer'}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-800 bg-gradient-to-br from-amber-500 to-amber-600 text-sm font-bold text-white">
      {getInitials()}
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
  userId,
}: Props) {
  const t = useTranslations('reviews')
  const [rating, setRating] = useState(userReview?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(userReview?.comment ?? '')
  const [photos, setPhotos] = useState<PhotoUploadResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(!userReview)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }
    setLoading(true)
    setError(null)
    const photoUrls = photos.map((p) => p.url)
    const result = await submitReview(
      productId,
      rating,
      comment,
      orderIdFromQuery ?? undefined,
      productSlug,
      photoUrls
    )
    setLoading(false)
    if (result.ok) {
      setSuccess(true)
      setPhotos([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setError(result.error)
    }
  }

  return (
    <section className="mt-8 border-t border-white/5 pt-8">
      <h2 className="text-xl font-semibold text-zinc-50">{t('title')}</h2>

      {reviews.length === 0 && !canSubmit && <p className="mt-4 text-zinc-500">{t('noReviews')}</p>}

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-6">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start gap-4">
                <ReviewerAvatar displayName={r.reviewer_display_name} avatarUrl={r.avatar_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-zinc-200">
                        {r.reviewer_display_name ?? 'Customer'}
                      </span>
                      <StarRating rating={r.rating} />
                    </div>
                    <span className="text-sm text-zinc-400">
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
                  {r.comment && <p className="mt-2 text-zinc-300">{r.comment}</p>}
                  {/* Review Photos */}
                  {r.photos && r.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {r.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <Image
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            fill
                            className="object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canSubmit ? (
        <div className="mt-8">
          {/* Divider before user's own section */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              {t('yourReview')}
            </span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* User already has a review — show it with an Edit button */}
          {userReview && !isEditing ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 relative overflow-hidden">
              {/* Amber left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500/60 rounded-l-lg" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 ring-1 ring-amber-500/20">
                    You
                  </span>
                  <StarRating rating={userReview.rating} />
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  {t('editReview')}
                </button>
              </div>
              {userReview.comment && (
                <p className="mt-2 text-zinc-300 text-sm">{userReview.comment}</p>
              )}
            </div>
          ) : (
            /* Write or edit form */
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-50">
                  {userReview ? t('yourReview') : t('writeReview')}
                </h3>
                {userReview && (
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setError(null)
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400">{t('rating')}</label>
                  <div className="mt-2 flex gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        className="cursor-pointer rounded p-1 text-2xl focus:outline-none"
                        aria-label={`${i} stars`}
                      >
                        <span
                          className={`transition-colors ${i <= (hoverRating || rating) ? 'text-amber-400' : 'text-zinc-600'}`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-sm font-medium text-zinc-400"
                  >
                    {t('comment')}
                  </label>
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                    placeholder="Share your experience with this product..."
                  />
                </div>
                {userId && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      {t('photos')} (Optional)
                    </label>
                    <PhotoUpload userId={userId} onPhotosChange={setPhotos} />
                    <p className="mt-2 text-xs text-zinc-500">
                      Add photos to help others see how the product looks
                    </p>
                  </div>
                )}
                {error && <p className="text-sm text-red-400">{error}</p>}
                {success && (
                  <p className="text-sm text-emerald-400">Thank you! Your review has been saved.</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-amber-500 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-zinc-950 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? t('submitting') : t('submit')}
                </button>
              </form>
            </>
          )}
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
