'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { submitReview } from '@/actions/reviews'
import { PhotoUpload } from './PhotoUpload'
import type { PhotoUploadResult } from '@/lib/review-photos'
import { trackReviewSubmit, trackPhotoUpload } from '@/lib/analytics'

type ReviewFormProps = {
    productId: string
    productSlug: string
    productName?: string
    userId: string
    orderId?: string
    onSuccess?: () => void
}

export function ReviewForm({ productId, productSlug, productName, userId, orderId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [photos, setPhotos] = useState<PhotoUploadResult[]>([])
    const [hoveredStar, setHoveredStar] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            const photoUrls = photos.map(p => p.url)
            const result = await submitReview(
                productId,
                rating,
                comment,
                orderId,
                productSlug,
                photoUrls
            )

            if (!result.ok) {
                setError(result.error)
                return
            }

            // Track analytics
            trackReviewSubmit({
                id: productId,
                name: productName || 'Unknown Product',
                rating,
                hasPhotos: photoUrls.length > 0,
            })

            if (photoUrls.length > 0) {
                trackPhotoUpload(productId, photoUrls.length)
            }

            // Success
            setComment('')
            setRating(5)
            setPhotos([])
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit review')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            className="p-1 transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${star <= (hoveredStar || rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-neutral-600'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment */}
            <div>
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                    Your Review
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-neutral-500 focus:outline-none resize-none"
                />
            </div>

            {/* Photo Upload */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Photos (Optional)
                </label>
                <PhotoUpload
                    userId={userId}
                    onPhotosChange={setPhotos}
                />
                <p className="mt-2 text-xs text-neutral-400">
                    Add photos to help others see how the product looks in real life
                </p>
            </div>

            {/* Verified Purchase Badge */}
            {orderId && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                    ✓ Verified Purchase
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    )
}
