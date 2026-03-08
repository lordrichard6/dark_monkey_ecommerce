'use client'

import { useEffect, useState } from 'react'
import { isPushNotificationSubscribed } from '@/lib/push-notifications'

export function NotificationsBadge() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    isPushNotificationSubscribed()
      .then(setActive)
      .catch(() => {})
  }, [])

  if (!active) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Active
    </span>
  )
}
