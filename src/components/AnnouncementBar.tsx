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
    if (!hasAnnouncements) {
      document.documentElement.style.setProperty('--ann-bar-h', '0rem')
      return
    }
    // Fingerprint includes text so editing an announcement resets dismissal
    const fingerprint = JSON.stringify(announcements.map((a) => `${a.id}:${a.text}`).sort())
    const dismissed = localStorage.getItem('dm_ann_dismissed')
    const visible = dismissed !== fingerprint
    setIsVisible(visible)
    document.documentElement.style.setProperty('--ann-bar-h', visible ? '2.5rem' : '0rem')
  }, [announcements, hasAnnouncements])

  useEffect(() => {
    if (!hasAnnouncements) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [announcements.length, hasAnnouncements])

  function handleDismiss() {
    const fingerprint = JSON.stringify(announcements.map((a) => `${a.id}:${a.text}`).sort())
    localStorage.setItem('dm_ann_dismissed', fingerprint)
    setIsVisible(false)
    document.documentElement.style.setProperty('--ann-bar-h', '0rem')
  }

  if (!isVisible || !hasAnnouncements) return null

  const currentAnnouncement = announcements[currentIndex] ?? announcements[0]
  const variant = currentAnnouncement?.variant ?? 'default'
  const styles = variantStyles[variant] ?? variantStyles.default

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] py-2 md:py-2.5 md:left-16 ${styles.bar}`}>
      <div className="mx-auto flex max-w-7xl items-center px-3 sm:px-6 lg:px-8 gap-2">
        {/* Text area */}
        <div className="flex flex-1 items-center justify-center min-w-0">
          <div className="relative w-full overflow-hidden" style={{ minHeight: '1.25rem' }}>
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className={`flex items-center justify-center gap-1.5 transition-all duration-500 ease-in-out ${
                  index === currentIndex
                    ? 'relative opacity-100'
                    : 'absolute inset-0 opacity-0 pointer-events-none ' +
                      (index < currentIndex ? '-translate-y-full' : 'translate-y-full')
                }`}
              >
                <Sparkles className={`h-3.5 w-3.5 shrink-0 ${styles.icon}`} />
                {announcement.url ? (
                  <a
                    href={announcement.url}
                    className="text-xs font-medium tracking-wide text-zinc-300 hover:text-white hover:underline leading-snug text-center"
                  >
                    {announcement.text}
                  </a>
                ) : (
                  <span className="text-xs font-medium tracking-wide text-zinc-300 leading-snug text-center">
                    {announcement.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls — arrows hidden on mobile */}
        <div className="flex shrink-0 items-center gap-0.5">
          {announcements.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentIndex(
                    (prev) => (prev - 1 + announcements.length) % announcements.length
                  )
                }
                className="hidden sm:flex rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                className="hidden sm:flex rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Next announcement"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
