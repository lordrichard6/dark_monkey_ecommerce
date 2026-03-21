'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import {
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AdminNotification,
} from '@/actions/admin-notifications'

const POLL_INTERVAL_MS = 30_000 // 30 seconds
const TIMEAGO_REFRESH_MS = 60_000 // re-render time-ago labels every minute

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'order') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" />
        </svg>
      </span>
    )
  }
  if (type === 'support') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </span>
    )
  }
  // signup
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  )
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  // Tick counter to force timeAgo re-renders without a full fetch
  const [, setTick] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    const result = await getAdminNotifications()
    if (result.ok && result.notifications) {
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount ?? 0) // fix #3: count comes from server, not derived from list
    }
    setIsLoading(false)
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications()
    const pollId = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(pollId)
  }, [fetchNotifications])

  // Fix #6: refresh timeAgo labels every minute
  useEffect(() => {
    const tickId = setInterval(() => setTick((t) => t + 1), TIMEAGO_REFRESH_MS)
    return () => clearInterval(tickId)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleMarkAllRead() {
    setMarking(true)
    await markAllNotificationsRead()
    setMarking(false)
    fetchNotifications()
  }

  async function handleNotificationClick(n: AdminNotification) {
    if (!n.read_at) {
      await markNotificationRead(n.id)
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    // Fix #1: useRouter from @/i18n/navigation handles locale prefix automatically
    if (n.type === 'order') {
      router.push('/admin/orders')
    } else if (n.type === 'support') {
      const ticketId = (n.data as { ticketId?: string }).ticketId
      router.push(ticketId ? `/admin/support/${ticketId}` : '/admin/support')
    } else {
      router.push('/admin/customers')
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
          open ? 'bg-white/10 text-zinc-50' : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-50'
        }`}
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {/* Fix #4: badge sits in top-right corner, not inside the button */}
        {!isLoading && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={marking}
                className="text-[10px] font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
              >
                {marking ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:thin]">
            {/* Fix #5: show skeleton on initial load */}
            {isLoading ? (
              <div className="space-y-px">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-zinc-800" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-2.5 w-3/4 animate-pulse rounded bg-zinc-800" />
                      <div className="h-2 w-1/2 animate-pulse rounded bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-zinc-600">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                    !n.read_at ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <NotifIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`truncate text-xs font-medium ${
                          !n.read_at ? 'text-zinc-100' : 'text-zinc-400'
                        }`}
                      >
                        {n.title}
                      </span>
                      {!n.read_at && (
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      )}
                    </div>
                    {n.body && (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">{n.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-zinc-600">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
