import { type Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getFeedPosts, getUserLikedPosts, getComments } from '@/actions/feed'
import FeedLoadMore from './FeedLoadMore'

export const revalidate = 60

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'feed' })
  return {
    title: `${t('title')} | Dark Monkey`,
    description: t('subtitle'),
  }
}

export default async function FeedPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'feed' })

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
          <PageHeader title={t('title')} subtitle={t('subtitle')} />
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <p className="text-zinc-400">{t('noPosts')}</p>
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
        <PageHeader title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-10">
          <FeedLoadMore
            initialPosts={initialPosts}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            userLikedIds={likedIds}
            commentsMap={commentsMap}
          />
        </div>
      </div>
    </main>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
    </div>
  )
}
