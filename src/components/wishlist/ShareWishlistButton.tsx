'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Props = {
  userId: string
  isPublic: boolean
  onTogglePublic?: (isPublic: boolean) => void
}

export function ShareWishlistButton({ userId, isPublic, onTogglePublic }: Props) {
  const t = useTranslations('wishlist')
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/wishlist/${userId}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareViaWeb = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('myWishlist'),
          text: t('checkOutMyWishlist'),
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
      >
        <Share2 className="h-4 w-4" />
        {t('share')}
      </button>

      {showOptions && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />

          {/* Options Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
            {/* Privacy Toggle */}
            <div className="mb-4 rounded-lg bg-zinc-800/50 p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => onTogglePublic?.(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    {isPublic ? (
                      <>
                        <Share2 className="h-4 w-4 text-green-400" />
                        {t('publicWishlist')}
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-zinc-500" />
                        {t('privateWishlist')}
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {isPublic ? t('anyoneCanView') : t('onlyYouCanView')}
                  </p>
                </div>
              </label>
            </div>

            {isPublic ? (
              <div className="space-y-2">
                {/* Copy Link */}
                <button
                  onClick={copyLink}
                  className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-left text-sm transition hover:bg-zinc-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-green-400" />
                      <span className="text-green-400">{t('linkCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 text-zinc-400" />
                      <span className="text-zinc-300">{t('copyLink')}</span>
                    </>
                  )}
                </button>

                {/* Share via Web API */}
                <button
                  onClick={shareViaWeb}
                  className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-left text-sm transition hover:bg-zinc-700"
                >
                  <Share2 className="h-5 w-5 text-zinc-400" />
                  <span className="text-zinc-300">{t('shareVia')}</span>
                </button>

                {/* Link Display */}
                <div className="mt-3 rounded bg-zinc-800/50 p-2">
                  <p className="truncate text-xs text-zinc-500">{shareUrl}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-800/50 p-4 text-center">
                <Lock className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  {t('makePublicToShare')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
