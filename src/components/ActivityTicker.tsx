'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getRecentActivity, type ActivityEvent } from '@/actions/activity-ticker'

const MAX_QUEUE = 10
const CYCLE_INTERVAL_MS = 4000
const FADE_DURATION_MS = 400

const TYPE_CONFIG = {
  purchase: {
    dot: 'bg-amber-400',
    label: 'Purchase',
    labelColor: 'text-amber-400',
    pulse: 'bg-amber-400',
  },
  review: {
    dot: 'bg-emerald-400',
    label: 'Review',
    labelColor: 'text-emerald-400',
    pulse: 'bg-emerald-400',
  },
  like: {
    dot: 'bg-blue-400',
    label: 'Like',
    labelColor: 'text-blue-400',
    pulse: 'bg-blue-400',
  },
} as const

export function ActivityTicker() {
  const pathname = usePathname()
  const [queue, setQueue] = useState<ActivityEvent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAdmin = pathname.includes('/admin')

  // Seed queue on mount and subscribe to realtime
  useEffect(() => {
    if (isAdmin) return
    let cancelled = false

    getRecentActivity(8).then((events) => {
      if (cancelled || events.length === 0) return
      setQueue(events)
      setCurrentIndex(0)
      setVisible(true)
    })

    const supabase = createClient()

    const purchaseChannel = supabase
      .channel('activity-ticker-purchases')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'recent_purchases' },
        (payload) => {
          const row = payload.new as { id: string; purchased_at: string }
          const newEvent: ActivityEvent = {
            id: `purchase-rt-${row.id}`,
            type: 'purchase',
            text: 'Someone just bought a product',
            subtext: 'just now',
            timestamp: row.purchased_at || new Date().toISOString(),
          }
          setQueue((prev) => [newEvent, ...prev].slice(0, MAX_QUEUE))
          setCurrentIndex(0)
        }
      )
      .subscribe()

    const reviewChannel = supabase
      .channel('activity-ticker-reviews')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'product_reviews' },
        (payload) => {
          const row = payload.new as { id: string; created_at: string }
          const newEvent: ActivityEvent = {
            id: `review-rt-${row.id}`,
            type: 'review',
            text: 'Someone left a new review',
            subtext: 'just now',
            timestamp: row.created_at || new Date().toISOString(),
          }
          setQueue((prev) => [newEvent, ...prev].slice(0, MAX_QUEUE))
          setCurrentIndex(0)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      purchaseChannel.unsubscribe()
      reviewChannel.unsubscribe()
    }
  }, [])

  // Cycle through events every CYCLE_INTERVAL_MS
  useEffect(() => {
    if (queue.length === 0) return

    cycleTimer.current = setTimeout(() => {
      // Fade out
      setVisible(false)

      fadeTimer.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % queue.length)
        setVisible(true)
      }, FADE_DURATION_MS)
    }, CYCLE_INTERVAL_MS)

    return () => {
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    }
  }, [queue, currentIndex])

  if (isAdmin || queue.length === 0) return null

  const event = queue[currentIndex]
  if (!event) return null

  const config = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.purchase

  return (
    <div className="fixed bottom-6 left-4 md:left-20 z-[60] pointer-events-none">
      <div
        className={[
          'w-[calc(100vw-2rem)] max-w-xs md:w-72 rounded-xl bg-zinc-900/95 border border-zinc-700/50 shadow-xl backdrop-blur-sm px-4 py-3',
          'transition-all duration-500',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          {/* Colored dot */}
          <div className="mt-1 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Type label */}
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider ${config.labelColor} mb-0.5`}
            >
              {config.label}
            </p>

            {/* Main text */}
            <p className="text-sm font-medium text-zinc-100 leading-snug">{event.text}</p>

            {/* Subtext */}
            {event.subtext && <p className="text-xs text-zinc-500 mt-0.5">{event.subtext}</p>}
          </div>

          {/* Animated pulse dot */}
          <div className="mt-1 flex-shrink-0 relative">
            <span
              className={`absolute inline-flex h-2 w-2 rounded-full ${config.pulse} opacity-75 animate-ping`}
            />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${config.pulse}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
