import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFeedPosts, getUserLikedPosts, getComments } from '@/actions/feed'
import FeedPost from '@/components/feed/FeedPost'

interface FeedSectionProps {
  locale: string
}

export default async function FeedSection({ locale }: FeedSectionProps) {
  const posts = await getFeedPosts(1, 3)
  if (!posts.length) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentUserId = user?.id ?? null

  // Check admin status
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin ?? false
  }

  const postIds = posts.map((p) => p.id)

  // Fetch liked posts and comments in parallel
  const [likedIds, ...commentsPerPost] = await Promise.all([
    getUserLikedPosts(postIds),
    ...posts.map((p) => getComments(p.id)),
  ])

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {/* Heading row */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">What&apos;s happening</h2>
        <Link
          href={`/${locale}/feed`}
          className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Grid of up to 3 posts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post, i) => (
          <FeedPost
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            userHasLiked={likedIds.includes(post.id)}
            initialComments={commentsPerPost[i]}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}
