'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import {
    requestNotificationPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isPushNotificationSubscribed,
} from '@/lib/push-notifications'

export function NotificationSettings() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        checkSubscriptionStatus()
    }, [])

    async function checkSubscriptionStatus() {
        try {
            const subscribed = await isPushNotificationSubscribed()
            setIsSubscribed(subscribed)

            if ('Notification' in window) {
                setPermission(Notification.permission)
            }
        } catch (error) {
            console.error('Failed to check subscription status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleNotifications() {
        setIsLoading(true)

        try {
            if (isSubscribed) {
                // Unsubscribe
                const success = await unsubscribeFromPushNotifications()
                if (success) {
                    setIsSubscribed(false)
                }
            } else {
                // Request permission and subscribe
                const granted = await requestNotificationPermission()

                if (granted) {
                    const subscription = await subscribeToPushNotifications()
                    if (subscription) {
                        setIsSubscribed(true)
                    }
                } else {
                    alert('Please enable notifications in your browser settings.')
                }
            }

            if ('Notification' in window) {
                setPermission(Notification.permission)
            }
        } catch (error) {
            console.error('Failed to toggle notifications:', error)
            alert('Failed to update notification settings. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Don't show if notifications not supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return null
    }

    // Permission denied
    if (permission === 'denied') {
        return (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-start gap-3">
                    <BellOff className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">Notifications Blocked</h3>
                        <p className="text-sm text-zinc-400">
                            Notifications are blocked in your browser. Please enable them in your browser settings to receive order updates.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isSubscribed ? 'text-green-500' : 'text-zinc-400'}`} />
                    <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">Push Notifications</h3>
                        <p className="text-sm text-zinc-400">
                            {isSubscribed
                                ? 'Get notified about order updates, shipping status, and restock alerts'
                                : 'Enable notifications to stay updated on your orders'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggleNotifications}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition flex-shrink-0 ${isSubscribed
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                </button>
            </div>

            {isSubscribed && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-zinc-500">
                            You'll receive notifications for:
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/push/test', { method: 'POST' })
                                    if (res.ok) {
                                        alert('Test notification sent! Check your notifications.')
                                    } else {
                                        alert('Failed to send test notification')
                                    }
                                } catch (error) {
                                    alert('Error sending test notification')
                                }
                            }}
                            className="text-xs text-green-500 hover:text-green-400 font-medium"
                        >
                            Send Test
                        </button>
                    </div>
                    <ul className="space-y-1 text-xs text-zinc-400">
                        <li>• Order confirmations</li>
                        <li>• Shipping updates</li>
                        <li>• Product restock alerts</li>
                    </ul>
                </div>
            )}
        </div>
    )
}
