'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { Announcement } from '@/actions/announcements'

type Props = {
  announcements?: Announcement[]
}

const variantStyles: Record<string, { bar: string; icon: string }> = {
  default: { bar: 'bg-zinc-950 border-b border-white/5', icon: 'text-amber-400' },
  info: { bar: 'bg-blue-950 border-b border-blue-800', icon: 'text-blue-400' },
  promo: { bar: 'bg-green-950 border-b border-green-800', icon: 'text-green-400' },
  warning: { bar: 'bg-yellow-950 border-b border-yellow-800', icon: 'text-yellow-400' },
}

export function AnnouncementBar({ announcements = [] }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const hasAnnouncements = announcements.length > 0

  // Persistent dismiss via localStorage fingerprint
  useEffect(() => {
    if (!hasAnnouncements) return
    const fingerprint = JSON.stringify(announcements.map((a) => a.id).sort())
    const dismissed = localStorage.getItem('dm_ann_dismissed')
    setIsVisible(dismissed !== fingerprint)
  }, [announcements, hasAnnouncements])

  useEffect(() => {
    if (!hasAnnouncements) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [announcements.length, hasAnnouncements])

  function handleDismiss() {
    const fingerprint = JSON.stringify(announcements.map((a) => a.id).sort())
    localStorage.setItem('dm_ann_dismissed', fingerprint)
    setIsVisible(false)
  }

  if (!isVisible || !hasAnnouncements) return null

  const currentAnnouncement = announcements[currentIndex] ?? announcements[0]
  const variant = currentAnnouncement?.variant ?? 'default'
  const styles = variantStyles[variant] ?? variantStyles.default

  return (
    <div className={`relative z-50 py-2.5 ${styles.bar}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-5 w-full overflow-hidden">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ease-in-out ${
                  index === currentIndex
                    ? 'translate-y-0 opacity-100'
                    : index < currentIndex
                      ? '-translate-y-full opacity-0'
                      : 'translate-y-full opacity-0'
                }`}
              >
                <Sparkles className={`h-4 w-4 ${styles.icon}`} />
                {announcement.url ? (
                  <a
                    href={announcement.url}
                    className="text-xs font-medium tracking-wide text-zinc-300 hover:text-white hover:underline sm:text-sm"
                  >
                    {announcement.text}
                  </a>
                ) : (
                  <span className="text-xs font-medium tracking-wide text-zinc-300 sm:text-sm">
                    {announcement.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {announcements.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentIndex(
                    (prev) => (prev - 1 + announcements.length) % announcements.length
                  )
                }
                className="rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                className="rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Next announcement"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="ml-2 rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
