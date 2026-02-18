'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteReview } from '@/actions/admin-reviews'
import { Trash2 } from 'lucide-react'

type Review = {
  id: string
  rating: number
  comment: string | null
  photos: string[]
  reviewer_display_name: string | null
  created_at: string
  products: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type Props = {
  reviews: Review[]
  totalCount: number
  currentPage: number
  totalPages: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm" title={`${rating}/5`}>
      <span className="text-amber-400">{'★'.repeat(rating)}</span>
      <span className="text-zinc-700">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function DeleteButton({ reviewId, onDeleted }: { reviewId: string; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await deleteReview(reviewId)
          if (result.ok) onDeleted()
        })
      }
      disabled={isPending}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
      title="Delete review"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? '…' : 'Delete'}
    </button>
  )
}

export function ReviewsTable({
  reviews: initialReviews,
  totalCount,
  currentPage,
  totalPages,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews)

  function getProduct(r: Review) {
    if (!r.products) return null
    return Array.isArray(r.products) ? (r.products[0] ?? null) : r.products
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '—'

  return (
    <div>
      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap items-center gap-6 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
        <span>
          <span className="font-semibold text-zinc-50">{totalCount}</span> total review
          {totalCount !== 1 ? 's' : ''}
        </span>
        <span>
          Avg rating: <span className="font-semibold text-amber-400">{avgRating}</span>
          {avgRating !== '—' && <span className="ml-1 text-amber-400">★</span>}
        </span>
        <span>
          Showing page <span className="font-semibold text-zinc-50">{currentPage}</span> of{' '}
          {totalPages}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {reviews.map((r) => {
          const product = getProduct(r)
          return (
            <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {product && (
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300"
                    >
                      {product.name}
                    </Link>
                  )}
                  <div className="mt-1">
                    <StarRating rating={r.rating} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {r.reviewer_display_name ?? 'Anonymous'}
                  </p>
                  {r.comment && (
                    <p className="mt-2 text-sm text-zinc-300 line-clamp-2">{r.comment}</p>
                  )}
                </div>
                <DeleteButton
                  reviewId={r.id}
                  onDeleted={() => setReviews((prev) => prev.filter((x) => x.id !== r.id))}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {r.photos.length} photo{r.photos.length !== 1 ? 's' : ''}
                </span>
                <span>
                  {new Date(r.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Comment
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Photos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {reviews.map((r) => {
                const product = getProduct(r)
                return (
                  <tr key={r.id} className="group hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      {product ? (
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">Deleted product</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {r.reviewer_display_name ?? 'Anonymous'}
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={r.rating} />
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-300">
                      {r.comment ? (
                        <span className="line-clamp-2 text-sm">{r.comment}</span>
                      ) : (
                        <span className="text-zinc-600 italic">No comment</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">{r.photos.length}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(r.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteButton
                        reviewId={r.id}
                        onDeleted={() => setReviews((prev) => prev.filter((x) => x.id !== r.id))}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {reviews.length === 0 && (
        <div className="mt-8 text-center text-zinc-500">No reviews found.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <a
                href={`?page=${currentPage - 1}`}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                ← Previous
              </a>
            )}
            {currentPage < totalPages && (
              <a
                href={`?page=${currentPage + 1}`}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
