'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
} from '@/lib/push-notifications'
import { NotificationSettingsSkeleton } from '@/components/account/NotificationSettingsSkeleton'

export function NotificationSettings() {
  const t = useTranslations('account')

  // ready: false until the initial browser check + subscription lookup is done
  const [ready, setReady] = useState(false)
  // busy: true only while the user's toggle/test action is in flight
  const [busy, setBusy] = useState(false)

  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    async function init() {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setSupported(false)
        setReady(true)
        return
      }
      setSupported(true)
      setPermission(Notification.permission)
      try {
        const isSubscribed = await isPushNotificationSubscribed()
        setSubscribed(isSubscribed)
      } catch {
        // leave subscribed = false
      }
      setReady(true)
    }
    init()
  }, [])

  async function handleToggle() {
    setBusy(true)
    try {
      if (subscribed) {
        const ok = await unsubscribeFromPushNotifications()
        if (ok) {
          setSubscribed(false)
          toast.success(t('pushDisabled'))
        } else {
          toast.error(t('pushFailedDisable'))
        }
      } else {
        const granted = await requestNotificationPermission()
        if (!granted) {
          setPermission(Notification.permission) // update to 'denied' if they blocked it
          toast.error(t('pushEnableBrowserSettings'))
          return
        }
        const sub = await subscribeToPushNotifications()
        if (sub) {
          setSubscribed(true)
          setPermission('granted')
          toast.success(t('pushEnabled'))
        } else {
          toast.error(t('pushFailedEnable'))
        }
      }
    } catch {
      toast.error(t('pushSomethingWrong'))
    } finally {
      setBusy(false)
    }
  }

  async function handleSendTest() {
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      if (res.ok) {
        toast.success(t('pushTestSent'))
      } else {
        toast.error(t('pushTestFailed'))
      }
    } catch {
      toast.error(t('pushTestFailed'))
    }
  }

  // Show skeleton until the initial check is done
  if (!ready) return <NotificationSettingsSkeleton />

  // Browser doesn't support push
  if (!supported) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <BellOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500" />
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">{t('pushNotSupportedTitle')}</h3>
            <p className="text-sm text-zinc-400">{t('pushNotSupportedDesc')}</p>
          </div>
        </div>
      </div>
    )
  }

  // User has blocked notifications in the browser
  if (permission === 'denied') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <BellOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">{t('pushBlockedTitle')}</h3>
            <p className="text-sm text-zinc-400">{t('pushBlockedDesc')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          {/* Icon + label */}
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${
                subscribed ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <Bell className={`h-4 w-4 ${subscribed ? 'text-amber-400' : 'text-zinc-400'}`} />
            </div>
            <div>
              <h3 className="mb-0.5 font-semibold text-zinc-100">{t('pushNotificationsTitle')}</h3>
              <p className="text-sm text-zinc-400">
                {subscribed ? t('pushEnabledOnDevice') : t('pushDisabledDescription')}
              </p>
            </div>
          </div>

          {/* Toggle button */}
          <button
            onClick={handleToggle}
            disabled={busy}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              subscribed
                ? 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
                : 'bg-amber-500 text-black hover:bg-amber-400'
            }`}
          >
            {busy ? t('pushLoading') : subscribed ? t('pushDisable') : t('pushEnable')}
          </button>
        </div>

        {/* Detail panel — only shown when subscribed */}
        {subscribed && (
          <div className="mt-4 rounded-lg border border-white/5 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">{t('pushNotifyFor')}</p>
              <button
                onClick={handleSendTest}
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
              >
                <Send className="h-3 w-3" />
                {t('pushSendTest')}
              </button>
            </div>
            <ul className="space-y-1.5">
              {[t('pushNotifyOrders'), t('pushNotifyShipping'), t('pushNotifyRestocks')].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-amber-500/70" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Per-device note */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-xs text-zinc-500">
        {t('pushDeviceNote')}
      </div>
    </div>
  )
}
