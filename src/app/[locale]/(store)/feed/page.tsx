import { type Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getFeedPosts, getUserLikedPosts, getComments } from '@/actions/feed'
import FeedLoadMore from './FeedLoadMore'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Feed | Dark Monkey',
  description: 'Latest drops, promotions, and stories from Dark Monkey',
}

interface Props {
  params: Promise<{ locale: string }>
}

export default async function FeedPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Auth + admin check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentUserId = user?.id ?? null

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin ?? false
  }

  // Initial data fetch
  const initialPosts = await getFeedPosts(1, 10)

  if (!initialPosts.length) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <PageHeader />
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <p className="text-zinc-400">Nothing here yet. Check back soon.</p>
          </div>
        </div>
      </main>
    )
  }

  const postIds = initialPosts.map((p) => p.id)

  const [likedIds, ...commentsPerPost] = await Promise.all([
    getUserLikedPosts(postIds),
    ...initialPosts.map((p) => getComments(p.id)),
  ])

  // Build a map so FeedLoadMore can look up comments by post id
  const commentsMap: Record<string, (typeof commentsPerPost)[number]> = {}
  initialPosts.forEach((p, i) => {
    commentsMap[p.id] = commentsPerPost[i]
  })

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <PageHeader />

        <div className="mt-10">
          <FeedLoadMore
            initialPosts={initialPosts}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            userLikedIds={likedIds}
            commentsMap={commentsMap}
            locale={locale}
          />
        </div>
      </div>
    </main>
  )
}

function PageHeader() {
  return (
    <div className="mb-2">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Feed</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Stay up to date with drops, stories, and community highlights
      </p>
    </div>
  )
}
