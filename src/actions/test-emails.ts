'use server'

import { getAdminUser } from '@/lib/auth-admin'
import {
    sendOrderConfirmation,
    sendAbandonedCartEmail,
    sendRestockAlert,
    sendWishlistReminderEmail
} from '@/lib/resend'

export type EmailTestType = 'order' | 'abandoned-cart' | 'restock' | 'wishlist'

export async function sendTestEmail(type: EmailTestType, toEmail: string, locale: string = 'en') {
    // 1. Verify Admin
    const admin = await getAdminUser()
    if (!admin) {
        return { ok: false, error: 'Unauthorized: Admin access required' }
    }

    // 2. Route to correct email helper with MOCK data
    try {
        switch (type) {
            case 'order':
                return await sendOrderConfirmation({
                    to: toEmail,
                    orderId: 'TEST-ORDER-1234',
                    totalCents: 12900, // CHF 129.00
                    currency: 'CHF',
                    itemCount: 2,
                    customerName: 'Test Admin',
                    locale
                })

            case 'abandoned-cart':
                return await sendAbandonedCartEmail({
                    to: toEmail,
                    itemCount: 3,
                    totalCents: 45000, // CHF 450.00
                    productNames: ['Premium Hoodie (Black)', 'Signature Cap', 'Urban Tote Bag'],
                    cartUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'}/checkout`,
                    locale
                })

            case 'restock':
                return await sendRestockAlert({
                    to: toEmail,
                    productName: 'Limited Edition Bomber Jacket',
                    productUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'}/products/bomber-jacket`,
                    locale
                })

            case 'wishlist':
                return await sendWishlistReminderEmail({
                    to: toEmail,
                    itemCount: 5,
                    wishlistUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'}/account/wishlist`,
                    locale
                })

            default:
                return { ok: false, error: 'Invalid email type' }
        }
    } catch (error) {
        console.error('Test email failed:', error)
        return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
