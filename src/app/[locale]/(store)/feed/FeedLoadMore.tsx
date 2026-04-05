'use client'

import { useState } from 'react'
import FeedPost from '@/components/feed/FeedPost'
import { getFeedPosts } from '@/actions/feed'
import type { FeedPost as FeedPostType, FeedComment } from '@/actions/feed'

interface FeedLoadMoreProps {
  initialPosts: FeedPostType[]
  currentUserId: string | null
  isAdmin: boolean
  userLikedIds: string[]
  commentsMap: Record<string, FeedComment[]>
  locale: string
}

export default function FeedLoadMore({
  initialPosts,
  currentUserId,
  isAdmin,
  userLikedIds,
  commentsMap,
  locale,
}: FeedLoadMoreProps) {
  const [posts, setPosts] = useState<FeedPostType[]>(initialPosts)
  const [localCommentsMap, setLocalCommentsMap] =
    useState<Record<string, FeedComment[]>>(commentsMap)
  const [likedIds, setLikedIds] = useState<string[]>(userLikedIds)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 10)

  async function loadMore() {
    if (loading) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const newPosts = await getFeedPosts(nextPage, 10)

      if (newPosts.length > 0) {
        // Comments for newly loaded posts are not pre-fetched on the client —
        // they will be fetched lazily by CommentToggle when opened.
        const newCommentsMap: Record<string, FeedComment[]> = {}
        for (const p of newPosts) {
          newCommentsMap[p.id] = []
        }
        setPosts((prev) => [...prev, ...newPosts])
        setLocalCommentsMap((prev) => ({ ...prev, ...newCommentsMap }))
        setPage(nextPage)
      }

      if (newPosts.length < 10) {
        setHasMore(false)
      }
    } catch {
      // silently fail — button stays visible for retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          userHasLiked={likedIds.includes(post.id)}
          initialComments={localCommentsMap[post.id] ?? []}
          locale={locale}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-full border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
