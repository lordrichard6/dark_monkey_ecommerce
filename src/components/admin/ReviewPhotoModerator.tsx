'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteReviewPhoto, deleteReview } from '@/actions/admin-reviews'
import Image from 'next/image'

type Review = {
    id: string
    rating: number
    comment: string | null
    photos: string[]
    reviewer_display_name: string
    created_at: string
    products: {
        name: string
        slug: string
    }[] // Supabase returns this as an array from the join
}

type ReviewPhotoModeratorProps = {
    reviews: Review[]
}

export function ReviewPhotoModerator({ reviews }: ReviewPhotoModeratorProps) {
    const [isPending, startTransition] = useTransition()
    const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null)
    const [deletingReview, setDeletingReview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDeletePhoto = (reviewId: string, photoUrl: string) => {
        if (!confirm('Delete this photo from the review?')) return

        setError(null)
        setDeletingPhoto(photoUrl)

        startTransition(async () => {
            const result = await deleteReviewPhoto(reviewId, photoUrl)

            if (!result.ok) {
                setError(`Failed to delete photo: ${result.error}`)
            }

            setDeletingPhoto(null)
        })
    }

    const handleDeleteReview = (reviewId: string) => {
        if (!confirm('Delete this entire review? This cannot be undone.')) return

        setError(null)
        setDeletingReview(reviewId)

        startTransition(async () => {
            const result = await deleteReview(reviewId)

            if (!result.ok) {
                setError(`Failed to delete review: ${result.error}`)
            }

            setDeletingReview(null)
        })
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 text-neutral-400">
                <p>No reviews with photos to moderate</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Reviews List */}
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="p-6 rounded-lg bg-neutral-900 border border-neutral-800"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium">{review.products[0]?.name}</h3>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={
                                                star <= review.rating
                                                    ? 'text-yellow-400'
                                                    : 'text-neutral-600'
                                            }
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-neutral-400">
                                by {review.reviewer_display_name} •{' '}
                                {new Date(review.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Delete Review Button */}
                        <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={isPending || deletingReview === review.id}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                            title="Delete entire review"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                        <p className="mb-4 text-neutral-300">{review.comment}</p>
                    )}

                    {/* Photos Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {review.photos.map((photo, index) => (
                            <div key={index} className="relative aspect-square group">
                                <Image
                                    src={photo}
                                    alt={`Review photo ${index + 1}`}
                                    fill
                                    className="object-cover rounded-lg"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                />

                                {/* Delete Photo Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <button
                                        onClick={() => handleDeletePhoto(review.id, photo)}
                                        disabled={isPending || deletingPhoto === photo}
                                        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                                        title="Delete this photo"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Deleting Indicator */}
                                {deletingPhoto === photo && (
                                    <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
