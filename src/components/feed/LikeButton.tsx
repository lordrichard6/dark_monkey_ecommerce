'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/actions/feed'

interface LikeButtonProps {
  postId: string
  initialLiked: boolean
  initialCount: number
}

export default function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    // Optimistic update
    const nextLiked = !liked
    const nextCount = nextLiked ? count + 1 : count - 1
    setLiked(nextLiked)
    setCount(nextCount)

    startTransition(async () => {
      const result = await toggleLike(postId)
      if (!result.ok) {
        // Revert on error
        setLiked(liked)
        setCount(count)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={liked ? 'Unlike post' : 'Like post'}
      className={`flex items-center gap-1.5 text-sm transition-opacity ${
        isPending ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {liked ? (
        // Filled heart
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 text-amber-400"
          aria-hidden="true"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        // Outline heart
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 text-zinc-500"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
      <span className={liked ? 'text-amber-400' : 'text-zinc-500'}>{count}</span>
    </button>
  )
}
