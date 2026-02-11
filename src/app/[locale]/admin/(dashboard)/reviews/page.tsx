import { getReviewsWithPhotos } from '@/actions/admin-reviews'
import { ReviewPhotoModerator } from '@/components/admin/ReviewPhotoModerator'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Review Moderation | Admin',
    description: 'Moderate customer review photos',
}

export default async function AdminReviewsPage() {
    const { data: reviews, error } = await getReviewsWithPhotos()

    if (error) {
        if (error === 'Not authenticated') {
            redirect('/admin/login')
        }
        if (error === 'Not authorized') {
            redirect('/admin')
        }
        throw new Error(error)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Review Moderation</h1>
                <p className="text-neutral-400">
                    Manage customer review photos. Delete inappropriate or low-quality images.
                </p>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                <p className="text-sm text-neutral-300">
                    <strong>{reviews?.length || 0}</strong> reviews with photos
                </p>
            </div>

            <ReviewPhotoModerator reviews={reviews || []} />
        </div>
    )
}
