/**
 * Push Notifications Module
 * Handles web push notification subscriptions and sending
 */

export type PushSubscriptionData = {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Push notifications not supported')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission === 'denied') {
        console.warn('Notification permission denied')
        return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionData | null> {
    try {
        // Check if service worker is ready
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service workers not supported')
        }

        const registration = await navigator.serviceWorker.ready

        // Check if push manager is available
        if (!registration.pushManager) {
            throw new Error('Push manager not available')
        }

        // Get existing subscription or create new one
        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            // Get VAPID public key from env
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidPublicKey) {
                throw new Error('VAPID public key not configured')
            }

            // Subscribe to push notifications
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            })
        }

        // Convert subscription to JSON
        const subscriptionJson = subscription.toJSON()

        if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
            throw new Error('Invalid subscription format')
        }

        const subscriptionData: PushSubscriptionData = {
            endpoint: subscriptionJson.endpoint,
            keys: {
                p256dh: subscriptionJson.keys.p256dh!,
                auth: subscriptionJson.keys.auth!,
            },
        }

        // Send subscription to server
        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscriptionData,
                userAgent: navigator.userAgent,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to save subscription to server')
        }

        return subscriptionData
    } catch (error) {
        console.error('Push subscription failed:', error)
        return null
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator)) {
            return false
        }

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            return true // Already unsubscribed
        }

        // Unsubscribe from push
        await subscription.unsubscribe()

        // Remove from server
        await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
            }),
        })

        return true
    } catch (error) {
        console.error('Unsubscribe failed:', error)
        return false
    }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushNotificationSubscribed(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false
        }

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        return subscription !== null
    } catch {
        return false
    }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}

/**
 * Show a test notification (for debugging)
 */
export async function showTestNotification(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported')
        return
    }

    const registration = await navigator.serviceWorker.ready

    await registration.showNotification('DarkMonkey Test', {
        body: 'Push notifications are working!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
    })
}
