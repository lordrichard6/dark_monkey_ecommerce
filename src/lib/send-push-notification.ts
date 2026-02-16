/**
 * Send Push Notifications
 * Server-side utility to send web push notifications to users
 */

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configure web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@dark-monkey.ch', // Contact email
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export type PushNotificationPayload = {
    title: string
    body: string
    url?: string
    tag?: string
    icon?: string
    badge?: string
    requireInteraction?: boolean
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
    userId: string,
    notification: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
    try {
        const supabase = await createClient()

        // Fetch all active subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('id, subscription')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) {
            console.error('Failed to fetch subscriptions:', error)
            return { sent: 0, failed: 0 }
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log(`No active subscriptions for user ${userId}`)
            return { sent: 0, failed: 0 }
        }

        // Prepare notification payload
        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            data: {
                url: notification.url || '/',
                tag: notification.tag || 'default',
            },
            icon: notification.icon || '/icons/icon-192x192.png',
            badge: notification.badge || '/icons/icon-72x72.png',
            requireInteraction: notification.requireInteraction || false,
        })

        // Send to all subscriptions
        let sent = 0
        let failed = 0

        await Promise.all(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        sub.subscription as webpush.PushSubscription,
                        payload
                    )

                    // Update last_used_at
                    await supabase
                        .from('push_subscriptions')
                        .update({ last_used_at: new Date().toISOString() })
                        .eq('id', sub.id)

                    sent++
                } catch (error: unknown) {
                    console.error(`Failed to send to subscription ${sub.id}:`, error)

                    // If subscription is expired/invalid, mark as inactive
                    if (error instanceof Error && 'statusCode' in error) {
                        const statusCode = (error as { statusCode: number }).statusCode
                        if (statusCode === 410 || statusCode === 404) {
                            await supabase
                                .from('push_subscriptions')
                                .update({ is_active: false })
                                .eq('id', sub.id)
                        }
                    }

                    failed++
                }
            })
        )

        console.log(`Sent ${sent} notifications to user ${userId} (${failed} failed)`)
        return { sent, failed }
    } catch (error) {
        console.error('Send push notification error:', error)
        return { sent: 0, failed: 0 }
    }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
    userIds: string[],
    notification: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
    const results = await Promise.all(
        userIds.map((userId) => sendPushNotification(userId, notification))
    )

    const totals = results.reduce(
        (acc, result) => ({
            sent: acc.sent + result.sent,
            failed: acc.failed + result.failed,
        }),
        { sent: 0, failed: 0 }
    )

    return totals
}

/**
 * Send notification about order status
 */
export async function sendOrderNotification(
    userId: string,
    orderId: string,
    status: 'confirmed' | 'shipped' | 'delivered'
): Promise<void> {
    const messages = {
        confirmed: {
            title: 'Order Confirmed! 🎉',
            body: `Your order #${orderId.slice(0, 8)} has been confirmed and is being prepared.`,
        },
        shipped: {
            title: 'Order Shipped! 📦',
            body: `Your order #${orderId.slice(0, 8)} is on its way!`,
        },
        delivered: {
            title: 'Order Delivered! ✅',
            body: `Your order #${orderId.slice(0, 8)} has been delivered.`,
        },
    }

    const message = messages[status]

    await sendPushNotification(userId, {
        ...message,
        url: `/account/orders/${orderId}`,
        tag: `order-${orderId}`,
    })
}

/**
 * Send notification about product restock
 */
export async function sendRestockNotification(
    userIds: string[],
    productName: string,
    productSlug: string
): Promise<void> {
    await sendPushNotificationToUsers(userIds, {
        title: 'Back in Stock! 🔔',
        body: `${productName} is available again!`,
        url: `/products/${productSlug}`,
        tag: `restock-${productSlug}`,
    })
}

/**
 * Test notification (for debugging)
 */
export async function sendTestNotification(userId: string): Promise<void> {
    await sendPushNotification(userId, {
        title: 'Test Notification',
        body: 'If you see this, push notifications are working! 🎉',
        url: '/',
        tag: 'test',
    })
}
