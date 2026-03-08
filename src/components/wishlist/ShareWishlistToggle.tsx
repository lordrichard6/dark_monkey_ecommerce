'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Lock } from 'lucide-react'
import { setWishlistPublic } from '@/actions/wishlist'
import { toast } from 'sonner'

type Props = {
  userId: string
  initialIsPublic: boolean
}

export function ShareWishlistToggle({ userId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/wishlist/${userId}`
      : `/wishlist/${userId}`

  async function handleTogglePublic(val: boolean) {
    setIsUpdating(true)
    const result = await setWishlistPublic(val)
    if (result.ok) {
      setIsPublic(val)
      toast.success(val ? 'Wishlist is now public' : 'Wishlist is now private')
    } else {
      toast.error(result.error ?? 'Failed to update visibility')
    }
    setIsUpdating(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Wishlist', url: shareUrl })
      } catch {
        // user cancelled
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
      >
        {isPublic ? (
          <Share2 className="h-4 w-4 text-green-400" />
        ) : (
          <Lock className="h-4 w-4 text-zinc-500" />
        )}
        {isPublic ? 'Shared' : 'Share'}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
            {/* Privacy Toggle */}
            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-zinc-800/50 p-3">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={isPublic}
                  disabled={isUpdating}
                  onChange={(e) => handleTogglePublic(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                  {isPublic ? (
                    <>
                      <Share2 className="h-3.5 w-3.5 text-green-400" /> Public wishlist
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-zinc-500" /> Private wishlist
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {isPublic ? 'Anyone with the link can view' : 'Only you can see this'}
                </p>
              </div>
            </label>

            {isPublic ? (
              <div className="mt-3 space-y-2">
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm transition hover:bg-zinc-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Link copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-300">Copy link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm transition hover:bg-zinc-700"
                >
                  <Share2 className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-300">Share via…</span>
                </button>
                <div className="truncate rounded bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-600">
                  {shareUrl}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-center text-xs text-zinc-600">
                Enable public to share your wishlist
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
