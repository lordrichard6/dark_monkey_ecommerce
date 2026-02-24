'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { GalleryItem, voteForItem, getGalleryItems } from '@/actions/gallery'
import {
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

type SortOption = 'newest' | 'most_voted'

type Props = {
  initialItems: GalleryItem[]
  initialTotal: number
  initialPage: number
  tag?: string
  pageSize: number
}

export function GalleryGrid({ initialItems, initialTotal, initialPage, tag, pageSize }: Props) {
  const t = useTranslations('art')
  const [items, setItems] = useState(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [loadingMore, setLoadingMore] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('newest')

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)

  // Sync when server-side props change (tag filter)
  useEffect(() => {
    setItems(initialItems)
    setTotal(initialTotal)
    setPage(initialPage)
    const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
    if (voted.length > 0) {
      setItems((current) =>
        current.map((item) => ({
          ...item,
          has_voted: item.has_voted || voted.includes(item.id),
        }))
      )
    }
  }, [initialItems, initialTotal, initialPage])

  // Sorted view
  const sortedItems =
    sort === 'most_voted' ? [...items].sort((a, b) => b.votes_count - a.votes_count) : items

  // Init fingerprint + local votes
  useEffect(() => {
    let fp = localStorage.getItem('gallery_fingerprint')
    if (!fp) {
      fp = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('gallery_fingerprint', fp)
    }
    setFingerprint(fp)

    const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
    if (voted.length > 0) {
      setItems((current) =>
        current.map((item) => ({
          ...item,
          has_voted: item.has_voted || voted.includes(item.id),
        }))
      )
    }
  }, [])

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : null))
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (i !== null ? Math.min(sortedItems.length - 1, i + 1) : null))
    }

    window.addEventListener('keydown', handleKey)
    lightboxRef.current?.focus()
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, sortedItems.length])

  const handleVote = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!fingerprint) return

    const item = items.find((i) => i.id === itemId)
    if (!item) return

    if (item.has_voted) {
      toast.error(t('alreadyVoted'))
      return
    }

    const originalItems = [...items]
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, votes_count: i.votes_count + 1, has_voted: true } : i
      )
    )
    setVotingId(itemId)

    const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
    if (!voted.includes(itemId)) {
      voted.push(itemId)
      localStorage.setItem('gallery_voted_items', JSON.stringify(voted))
    }

    const result = await voteForItem(itemId, fingerprint)
    setVotingId(null)

    if (!result.ok) {
      toast.error(result.error || t('voteFailed'))
      setItems(originalItems)
      const newVoted = voted.filter((id: string) => id !== itemId)
      localStorage.setItem('gallery_voted_items', JSON.stringify(newVoted))
    } else {
      toast.success(t('voteSuccess'))
    }
  }

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const offset = (nextPage - 1) * pageSize

    try {
      const { items: newItems, total: newTotal } = await getGalleryItems(pageSize, offset, tag)
      const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
      setItems((prev) => [
        ...prev,
        ...newItems.map((item) => ({
          ...item,
          has_voted: item.has_voted || voted.includes(item.id),
        })),
      ])
      setTotal(newTotal)
      setPage(nextPage)
    } catch {
      toast.error('Failed to load more items')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, page, pageSize, tag])

  const hasMore = items.length < total

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 py-24 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800/80 ring-4 ring-white/5">
          <Heart className="h-9 w-9 text-zinc-600" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-white">{t('noArtFound')}</h3>
        <p className="max-w-sm text-sm text-zinc-500">{t('noArtMessage')}</p>
      </div>
    )
  }

  return (
    <>
      {/* Controls bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          Showing <span className="font-medium text-zinc-300">{items.length}</span> of{' '}
          <span className="font-medium text-zinc-300">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-zinc-600" />
          <div className="flex rounded-full border border-white/5 bg-zinc-900 p-1">
            <SortButton
              active={sort === 'newest'}
              onClick={() => setSort('newest')}
              icon={<Sparkles className="h-3 w-3" />}
              label="Newest"
            />
            <SortButton
              active={sort === 'most_voted'}
              onClick={() => setSort('most_voted')}
              icon={<TrendingUp className="h-3 w-3" />}
              label="Top Voted"
            />
          </div>
        </div>
      </div>

      {/* Masonry-feel responsive grid */}
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
        {sortedItems.map((item, idx) => (
          <GalleryCard
            key={item.id}
            item={item}
            idx={idx}
            votingId={votingId}
            onVote={handleVote}
            onOpen={() => setLightboxIndex(idx)}
            tVoteLabel={t('voteForThis')}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-900 px-7 py-3 text-sm font-semibold text-zinc-200 transition hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              <>
                {t('loadMore')}
                <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                  {total - items.length} more
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          ref={lightboxRef}
          items={sortedItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : null))}
          onNext={() =>
            setLightboxIndex((i) => (i !== null ? Math.min(sortedItems.length - 1, i + 1) : null))
          }
          onVote={handleVote}
          votingId={votingId}
          t={t}
        />
      )}
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SortButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function GalleryCard({
  item,
  idx,
  votingId,
  onVote,
  onOpen,
  tVoteLabel,
}: {
  item: GalleryItem
  idx: number
  votingId: string | null
  onVote: (id: string, e: React.MouseEvent) => void
  onOpen: () => void
  tVoteLabel: string
}) {
  // Alternate aspect ratios for a masonry feel: tall / square / portrait
  const aspects = [
    'aspect-[3/4]',
    'aspect-[4/5]',
    'aspect-[2/3]',
    'aspect-square',
    'aspect-[3/4]',
    'aspect-[4/5]',
  ]
  const aspect = aspects[idx % aspects.length]

  return (
    <div className="mb-5 break-inside-avoid">
      <div
        className={`group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 shadow-xl transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5 hover:shadow-2xl cursor-pointer ${aspect}`}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        aria-label={item.title}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      >
        {/* Image */}
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />

        {/* Gradient overlay — always slightly visible, stronger on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Vote button — top-right */}
        <button
          onClick={(e) => onVote(item.id, e)}
          disabled={!!votingId || item.has_voted}
          className={`absolute right-3 top-3 z-10 flex flex-col items-center gap-0.5 rounded-full px-2.5 py-2 leading-none shadow-xl backdrop-blur-md transition-all duration-200 ${
            item.has_voted
              ? 'cursor-default bg-amber-500 text-zinc-950 scale-110'
              : 'bg-black/50 text-white hover:scale-110 hover:bg-amber-500 hover:text-zinc-950'
          }`}
          aria-label={`${tVoteLabel} — ${item.title} (${item.votes_count})`}
        >
          <Heart className={`h-4 w-4 ${item.has_voted ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold">{item.votes_count}</span>
        </button>

        {/* Info — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-1 p-4 transition-transform duration-300 group-hover:translate-y-0">
          <h3 className="truncate text-sm font-bold leading-tight text-white">{item.title}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{item.description}</p>
          )}
          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300 backdrop-blur-sm"
                >
                  #{tag.name}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-[10px] text-zinc-500">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

import { forwardRef } from 'react'

const Lightbox = forwardRef<
  HTMLDivElement,
  {
    items: GalleryItem[]
    index: number
    onClose: () => void
    onPrev: () => void
    onNext: () => void
    onVote: (id: string, e: React.MouseEvent) => void
    votingId: string | null
    t: (key: string, values?: Record<string, string | number>) => string
  }
>(function Lightbox({ items, index, onClose, onPrev, onNext, onVote, votingId, t }, ref) {
  const item = items[index]
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 outline-none"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={t('imageOf', { current: index + 1, total: items.length })}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {index + 1} / {items.length}
        </span>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
          aria-label={t('closePreview')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-4 z-20 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label={t('prevImage')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Content — stop propagation so clicking image doesn't close */}
      <div
        className="relative flex max-h-[90vh] max-w-5xl w-full flex-col items-center gap-0 px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-1 flex items-center justify-center w-full">
          <Image
            src={item.image_url}
            alt={item.title}
            width={1000}
            height={1200}
            className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl"
            style={{ maxWidth: '80vw' }}
            priority
          />
        </div>

        {/* Caption card */}
        <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 p-4 backdrop-blur-md mt-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-white">{item.title}</h3>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{item.description}</p>
              )}
              {item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Vote button */}
            <button
              onClick={(e) => onVote(item.id, e)}
              disabled={!!votingId || item.has_voted}
              className={`flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                item.has_voted
                  ? 'cursor-default bg-amber-500 text-zinc-950'
                  : 'bg-white/10 text-white hover:bg-amber-500 hover:text-zinc-950'
              }`}
            >
              <Heart className={`h-4 w-4 ${item.has_voted ? 'fill-current' : ''}`} />
              <span>{item.votes_count}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 z-20 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label={t('nextImage')}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
})

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function GallerySkeleton({ count = 8 }: { count?: number }) {
  const aspects = [
    'aspect-[3/4]',
    'aspect-[4/5]',
    'aspect-[2/3]',
    'aspect-square',
    'aspect-[3/4]',
    'aspect-[4/5]',
  ]
  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`mb-5 break-inside-avoid ${aspects[i % aspects.length]} w-full animate-pulse rounded-2xl bg-zinc-900`}
        />
      ))}
    </div>
  )
}
