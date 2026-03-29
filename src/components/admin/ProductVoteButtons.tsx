'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { toast } from 'sonner'
import { castProductVote, type VoteType } from '@/actions/admin-votes'

export type AdminVote = {
  product_id: string
  user_id: string
  vote: VoteType
}

export type AdminProfile = {
  id: string
  admin_color: string | null
  display_name?: string | null
}

type Props = {
  productId: string
  currentUserId: string
  votes: AdminVote[]
  adminProfiles: AdminProfile[]
}

export function ProductVoteButtons({ productId, currentUserId, votes, adminProfiles }: Props) {
  const [optimisticVotes, setOptimisticVotes] = useState<AdminVote[]>(votes)
  const [loading, setLoading] = useState(false)

  const myVote = optimisticVotes.find((v) => v.user_id === currentUserId)?.vote ?? null

  async function handleVote(vote: VoteType) {
    if (loading) return

    // Optimistic update
    const prev = optimisticVotes
    if (myVote === vote) {
      // Toggle off
      setOptimisticVotes(optimisticVotes.filter((v) => v.user_id !== currentUserId))
    } else {
      // Set or switch
      setOptimisticVotes([
        ...optimisticVotes.filter((v) => v.user_id !== currentUserId),
        { product_id: productId, user_id: currentUserId, vote },
      ])
    }

    setLoading(true)
    const result = await castProductVote(productId, vote)
    setLoading(false)

    if (!result.ok) {
      setOptimisticVotes(prev) // revert
      toast.error(result.error ?? 'Failed to save vote')
    }
  }

  function colorForUser(userId: string): string {
    return adminProfiles.find((a) => a.id === userId)?.admin_color ?? '#71717a'
  }

  // Show votes from all other admins (read-only indicators)
  const otherVotes = optimisticVotes.filter((v) => v.user_id !== currentUserId)

  return (
    <div className="flex items-center gap-2">
      {/* Other admins' votes — read-only */}
      {otherVotes.map((v) => {
        const color = colorForUser(v.user_id)
        return (
          <span
            key={v.user_id}
            title={`${v.vote === 'up' ? '👍' : '👎'} by ${adminProfiles.find((a) => a.id === v.user_id)?.display_name ?? 'Admin'}`}
            style={{ color }}
          >
            {v.vote === 'up' ? (
              <ThumbsUp className="h-3.5 w-3.5" style={{ color }} />
            ) : (
              <ThumbsDown className="h-3.5 w-3.5" style={{ color }} />
            )}
          </span>
        )
      })}

      {/* Current user's vote buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleVote('up')}
          disabled={loading}
          title={myVote === 'up' ? 'Remove upvote' : 'Upvote'}
          className="rounded p-0.5 transition-all disabled:opacity-40 hover:scale-110"
          style={{
            color: myVote === 'up' ? colorForUser(currentUserId) : 'rgb(113 113 122)', // zinc-500
            opacity: myVote === 'down' ? 0.35 : 1,
          }}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={loading}
          title={myVote === 'down' ? 'Remove downvote' : 'Downvote'}
          className="rounded p-0.5 transition-all disabled:opacity-40 hover:scale-110"
          style={{
            color: myVote === 'down' ? colorForUser(currentUserId) : 'rgb(113 113 122)',
            opacity: myVote === 'up' ? 0.35 : 1,
          }}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
