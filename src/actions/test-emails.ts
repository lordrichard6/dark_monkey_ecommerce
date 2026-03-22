'use server'

import { getAdminUser } from '@/lib/auth-admin'
import {
  sendOrderConfirmation,
  sendAbandonedCartEmail,
  sendRestockAlert,
  sendWishlistReminderEmail,
  sendShipmentEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderCancellationEmail,
  sendReviewRequestEmail,
  sendConfirmationEmail,
  sendMagicLinkEmail,
} from '@/lib/resend'

export type EmailTestType =
  | 'order'
  | 'abandoned-cart'
  | 'restock'
  | 'wishlist'
  | 'shipment'
  | 'welcome'
  | 'cancellation'
  | 'review-request'
  | 'password-reset'
  | 'email-confirmation'
  | 'magic-link'

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
          locale,
        })

      case 'abandoned-cart':
        return await sendAbandonedCartEmail({
          to: toEmail,
          itemCount: 3,
          totalCents: 45000, // CHF 450.00
          productNames: ['Premium Hoodie (Black)', 'Signature Cap', 'Urban Tote Bag'],
          cartUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'}/checkout`,
          locale,
        })

      case 'restock':
        return await sendRestockAlert({
          to: toEmail,
          productName: 'Limited Edition Bomber Jacket',
          productUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'}/products/bomber-jacket`,
          locale,
        })

      case 'wishlist':
        return await sendWishlistReminderEmail({
          to: toEmail,
          itemCount: 5,
          wishlistUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'}/account/wishlist`,
          locale,
        })

      default:
        return { ok: false, error: 'Invalid email type' }
    }
  } catch (error) {
    console.error('Test email failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendTestEmailFull(
  type: string,
  toEmail: string,
  locale: string = 'en'
): Promise<{ ok: boolean; error?: string }> {
  // 1. Verify Admin
  const admin = await getAdminUser()
  if (!admin) {
    return { ok: false, error: 'Unauthorized: Admin access required' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'

  try {
    switch (type) {
      case 'order':
        return await sendOrderConfirmation({
          to: toEmail,
          orderId: 'TEST-ORDER-1234',
          totalCents: 12900,
          currency: 'CHF',
          itemCount: 2,
          customerName: 'Test Admin',
          locale,
        })
      case 'cancellation':
        return await sendOrderCancellationEmail({
          to: toEmail,
          orderId: 'TEST-ORDER-1234',
          totalCents: 12900,
          currency: 'CHF',
          locale,
        })
      case 'shipment':
        return await sendShipmentEmail({
          to: toEmail,
          orderId: 'TEST-ORDER-1234',
          trackingNumber: 'CH123456789',
          trackingUrl: `${appUrl}/track`,
          carrier: 'Swiss Post',
          locale,
        })
      case 'abandoned-cart':
        return await sendAbandonedCartEmail({
          to: toEmail,
          itemCount: 3,
          totalCents: 45000,
          productNames: ['Premium Hoodie (Black)', 'Signature Cap', 'Urban Tote Bag'],
          cartUrl: `${appUrl}/checkout`,
          locale,
        })
      case 'restock':
        return await sendRestockAlert({
          to: toEmail,
          productName: 'Limited Edition Bomber Jacket',
          productUrl: `${appUrl}/products/bomber-jacket`,
          locale,
        })
      case 'wishlist':
        return await sendWishlistReminderEmail({
          to: toEmail,
          itemCount: 5,
          wishlistUrl: `${appUrl}/account/wishlist`,
          locale,
        })
      case 'welcome':
        return await sendWelcomeEmail({
          to: toEmail,
          firstName: 'Test',
          locale,
        })
      case 'review-request': {
        const ok = await sendReviewRequestEmail({
          to: toEmail,
          orderId: 'TEST-ORDER-1234',
          productNames: ['Unisex Hoodie — Dark Monkey'],
          locale,
        })
        return { ok }
      }
      case 'password-reset':
        return await sendPasswordResetEmail({
          to: toEmail,
          resetUrl: `${appUrl}/reset-password?token=test`,
          locale,
        })
      case 'email-confirmation':
        return await sendConfirmationEmail({
          to: toEmail,
          confirmationUrl: `${appUrl}/${locale}/auth/callback?token=test`,
          locale,
        })
      case 'magic-link':
        return await sendMagicLinkEmail({
          to: toEmail,
          magicLinkUrl: `${appUrl}/${locale}/auth/callback?token=test`,
          locale,
        })
      default:
        return { ok: false, error: 'Invalid email type' }
    }
  } catch (error) {
    console.error('Test email failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
