import { getReviewsWithPhotos, getAdminReviews } from '@/actions/admin-reviews'
import { ReviewPhotoModerator } from '@/components/admin/ReviewPhotoModerator'
import { ReviewsTable } from '@/components/admin/ReviewsTable'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'

export const metadata = {
  title: 'Reviews | Admin',
  description: 'Manage customer reviews',
}

type SearchParams = Promise<{ page?: string }>

export default async function AdminReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const perPage = 30

  const [reviewsResult, photosResult] = await Promise.all([
    getAdminReviews(page, perPage),
    getReviewsWithPhotos(),
  ])

  if (reviewsResult.error === 'Not authenticated' || photosResult.error === 'Not authenticated') {
    redirect('/admin/login')
  }
  if (reviewsResult.error === 'Not authorized' || photosResult.error === 'Not authorized') {
    redirect('/admin')
  }

  const totalCount = reviewsResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
  const reviews = reviewsResult.data ?? []

  return (
    <div className="space-y-10 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 text-zinc-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Reviews</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Manage all customer reviews. Delete inappropriate content below.
          </p>
        </div>
      </div>

      {/* Full reviews table */}
      <ReviewsTable
        reviews={reviews.map((r) => ({
          id: r!.id,
          rating: r!.rating,
          comment: r!.comment ?? null,
          photos: (r as unknown as { photos: string[] }).photos ?? [],
          reviewer_display_name: r!.reviewer_display_name ?? null,
          created_at: r!.created_at,
          products: r!.products as unknown as
            | { name: string; slug: string }
            | { name: string; slug: string }[]
            | null,
        }))}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
      />

      {/* Divider */}
      <div className="border-t border-zinc-800 pt-8">
        <h2 className="mb-1 text-lg font-semibold text-zinc-50">Photo Moderation</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Reviews with photos — delete individual images or entire reviews.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
          <strong>{photosResult.data?.length ?? 0}</strong> review
          {(photosResult.data?.length ?? 0) !== 1 ? 's' : ''} with photos
        </div>
        <div className="mt-4">
          <ReviewPhotoModerator reviews={photosResult.data ?? []} />
        </div>
      </div>
    </div>
  )
}
