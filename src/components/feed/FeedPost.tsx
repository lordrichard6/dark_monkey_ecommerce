'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import LikeButton from './LikeButton'
import CommentSection from './CommentSection'
import type {
  FeedPost as FeedPostType,
  FeedPostType as PostType,
  FeedComment,
} from '@/actions/feed'

// ---------------------------------------------------------------------------
// ExpandableBody — client sub-component
// Truncates body HTML to 3 lines with a "Read more / Show less" toggle.
// ---------------------------------------------------------------------------

interface ExpandableBodyProps {
  html: string
}

function ExpandableBody({ html }: ExpandableBodyProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div
        className={`prose prose-sm prose-invert max-w-none text-zinc-300 ${
          !expanded ? 'line-clamp-3' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  )
}

export { ExpandableBody }

// ---------------------------------------------------------------------------
// CommentToggle — client sub-component
// Wraps CommentSection with an open/closed toggle button.
// ---------------------------------------------------------------------------

interface CommentToggleProps {
  postId: string
  initialComments: FeedComment[]
  currentUserId: string | null
  isAdmin: boolean
  commentCount: number
}

function CommentToggle({
  postId,
  initialComments,
  currentUserId,
  isAdmin,
  commentCount,
}: CommentToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-expanded={open}
        aria-label={open ? 'Hide comments' : 'Show comments'}
      >
        {/* Chat bubble icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
        <span>{commentCount}</span>
      </button>

      {open && (
        <div className="mt-4 w-full">
          <CommentSection
            postId={postId}
            initialComments={initialComments}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </>
  )
}

export { CommentToggle }

// ---------------------------------------------------------------------------
// Type badge config
// ---------------------------------------------------------------------------

interface BadgeConfig {
  label: string
  className: string
}

const TYPE_BADGE: Record<PostType, BadgeConfig> = {
  drop: {
    label: 'New Drop',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  new_product: {
    label: 'New Product',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  promo: {
    label: 'Promotion',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  story: {
    label: 'Story',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  community: {
    label: 'Community',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  sale: {
    label: 'Sale',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

// ---------------------------------------------------------------------------
// FeedPost — default export (server-compatible client component)
// ---------------------------------------------------------------------------

interface FeedPostProps {
  post: FeedPostType
  currentUserId: string | null
  isAdmin: boolean
  userHasLiked: boolean
  initialComments: FeedComment[]
  locale: string
}

export default function FeedPost({
  post,
  currentUserId,
  isAdmin,
  userHasLiked,
  initialComments,
}: FeedPostProps) {
  const badge = TYPE_BADGE[post.type]
  const authorName = post.author?.display_name ?? 'Dark Monkey'
  const authorInitial = authorName.trim().charAt(0).toUpperCase()
  const displayDate = post.published_at ?? post.created_at

  // Primary product image (lowest sort_order)
  const productImage =
    post.product?.product_images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
    null

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Hero image */}
      {post.image_url && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </div>
      )}

      {/* Content area */}
      <div className="p-5 flex flex-col gap-3">
        {/* Type badge */}
        <div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold leading-snug text-zinc-100">{post.title}</h2>

        {/* Body */}
        {post.body && <ExpandableBody html={post.body} />}

        {/* Linked product */}
        {post.product && (
          <Link
            href={`/products/${post.product.slug}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/50 p-3 hover:border-amber-500/40 hover:bg-zinc-800 transition group"
          >
            {productImage && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                <Image
                  src={productImage}
                  alt={post.product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                {post.product.name}
              </p>
              <p className="text-xs text-zinc-500">View product →</p>
            </div>
          </Link>
        )}

        {/* Author + date */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-zinc-300 select-none">
            {authorInitial}
          </div>
          <span className="text-zinc-400">{authorName}</span>
          <span>·</span>
          <span suppressHydrationWarning>
            {formatDistanceToNow(new Date(displayDate), { addSuffix: true })}
          </span>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap items-start gap-4">
          <LikeButton
            postId={post.id}
            initialLiked={userHasLiked}
            initialCount={post.likes_count}
          />
          <CommentToggle
            postId={post.id}
            initialComments={initialComments}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            commentCount={post.comments_count}
          />
        </div>
      </div>
    </article>
  )
}
