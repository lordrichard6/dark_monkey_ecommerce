'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp } from 'lucide-react'

type Props = {
  productId: string
  initialUp: number
  initialDown?: number
  variant?: 'inline' | 'overlay'
}

function getOrCreateSessionId(): string {
  const key = 'dm_session_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function ProductVoteButtons({ productId, initialUp, variant = 'inline' }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [up, setUp] = useState(initialUp)
  const [voted, setVoted] = useState(false)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const id = getOrCreateSessionId()
    setSessionId(id)
    const stored = localStorage.getItem(`dm_vote_${productId}`)
    if (stored === 'up') setVoted(true)
  }, [productId])

  function handleUpvote() {
    if (!sessionId || isPending) return

    // Optimistic update
    const wasVoted = voted
    setUp((v) => (wasVoted ? v - 1 : v + 1))
    setVoted(!wasVoted)

    if (!wasVoted) localStorage.setItem(`dm_vote_${productId}`, 'up')
    else localStorage.removeItem(`dm_vote_${productId}`)

    setIsPending(true)
    fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, sessionId }),
    })
      .then((r) => r.json())
      .then(({ up: serverUp, voted: serverVoted }) => {
        setUp(serverUp)
        setVoted(serverVoted)
        if (serverVoted) localStorage.setItem(`dm_vote_${productId}`, 'up')
        else localStorage.removeItem(`dm_vote_${productId}`)
      })
      .catch(() => {
        // Revert optimistic update on error
        setUp((v) => (wasVoted ? v + 1 : v - 1))
        setVoted(wasVoted)
        if (wasVoted) localStorage.setItem(`dm_vote_${productId}`, 'up')
        else localStorage.removeItem(`dm_vote_${productId}`)
      })
      .finally(() => setIsPending(false))
  }

  // ── Overlay variant: pill on the product image ──
  if (variant === 'overlay') {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpvote() }}
        disabled={isPending}
        aria-label="Upvote"
        className={`self-start flex items-center gap-1 rounded-full px-2.5 py-1 backdrop-blur-sm ring-1 transition-all active:scale-95 ${
          voted
            ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40'
            : 'bg-black/70 text-zinc-400 ring-white/10 hover:text-emerald-400'
        }`}
      >
        <ThumbsUp className={`h-3 w-3 ${voted ? 'fill-emerald-400' : ''}`} />
        {up > 0 && (
          <span className="text-[10px] font-semibold tabular-nums">{up}</span>
        )}
      </button>
    )
  }

  // ── Inline variant ──
  return (
    <button
      onClick={(e) => { e.preventDefault(); handleUpvote() }}
      disabled={isPending}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all active:scale-95 ${
        voted
          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
          : 'text-zinc-500 hover:text-emerald-400'
      }`}
      aria-label="Upvote"
    >
      <ThumbsUp className={`h-3 w-3 ${voted ? 'fill-emerald-400' : ''}`} />
      {up > 0 && <span>{up}</span>}
    </button>
  )
}
