import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { getFeedPosts, getUserLikedPosts, getCommentsByPostIds } from '@/actions/feed'
import FeedPost from '@/components/feed/FeedPost'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { ArrowRight } from 'lucide-react'
import { sanitizeProductHtml } from '@/lib/sanitize-html.server'

interface FeedSectionProps {
  locale: string
}

export default async function FeedSection({ locale }: FeedSectionProps) {
  const [t, rawPosts] = await Promise.all([getTranslations('feed'), getFeedPosts(1, 3)])
  // Sanitize post bodies server-side before any HTML reaches the client
  const posts = rawPosts.map((p) => ({
    ...p,
    body: p.body ? sanitizeProductHtml(p.body) : null,
  }))
  if (!posts.length) return null

  // Cached across the request — same call from AuthCTASection / CustomDesignSection
  // resolves once, not three times.
  const user = await getCachedUser()
  const currentUserId = user?.id ?? null

  const postIds = posts.map((p) => p.id)

  // Need the supabase client only for the admin lookup; comments + likes go
  // through their own server-action helpers.
  const supabase = currentUserId ? await createClient() : null

  // For anonymous visitors, skip the admin check and liked-posts query entirely.
  // Comments are batched into a single IN(...) query — was previously N round-trips.
  const [likedIds, adminProfile, commentsByPost] = await Promise.all([
    currentUserId ? getUserLikedPosts(postIds) : Promise.resolve([] as string[]),
    currentUserId && supabase
      ? supabase.from('user_profiles').select('is_admin').eq('id', currentUserId).single()
      : Promise.resolve({ data: null }),
    getCommentsByPostIds(postIds),
  ])

  const isAdmin = (adminProfile?.data as { is_admin?: boolean } | null)?.is_admin ?? false

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24">
      <ScrollReveal>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              {t('subtitle')}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl md:text-4xl font-serif lowercase italic">
              {t('whatsHappening')}
            </h2>
          </div>

          <Link
            href={`/${locale}/feed`}
            className="group hidden items-center justify-between rounded-full border border-white/15 bg-white/5 py-2 pl-5 pr-2 text-sm font-semibold text-zinc-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/30 hover:bg-white/10 active:scale-[0.97] sm:inline-flex"
          >
            <span className="pr-3">{t('viewAll')}</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post, i) => (
          <ScrollReveal key={post.id} delay={i * 0.08}>
            <FeedPost
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              userHasLiked={likedIds.includes(post.id)}
              initialComments={commentsByPost.get(post.id) ?? []}
            />
          </ScrollReveal>
        ))}
      </div>

      {/* Mobile view-all */}
      <div className="mt-8 flex justify-center sm:hidden">
        <Link
          href={`/${locale}/feed`}
          className="group inline-flex items-center justify-between rounded-full border border-white/15 bg-white/5 py-2 pl-5 pr-2 text-sm font-semibold text-zinc-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/30 hover:bg-white/10 active:scale-[0.97]"
        >
          <span className="pr-3">{t('viewAll')}</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </section>
  )
}
