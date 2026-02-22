import { Resend } from 'resend'
import { generateEmailHtml, getEmailStrings } from './email-template'

const apiKey = process.env.RESEND_API_KEY

export function isResendConfigured(): boolean {
  return Boolean(apiKey?.trim())
}

export function getResendClient(): Resend | null {
  if (!apiKey?.trim()) return null
  return new Resend(apiKey)
}

/** Default "from" address. Use a verified domain when you have one. */
export function getDefaultFrom(): string {
  return process.env.RESEND_FROM ?? 'onboarding@resend.dev'
}

export type OrderConfirmationPayload = {
  to: string
  orderId: string
  totalCents: number
  currency: string
  itemCount: number
  customerName?: string
  locale?: string
  registerUrl?: string
}

export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_NOT_CONFIGURED' }
  }

  const locale = payload.locale || 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, 'orderConfirmation') as any

  const totalFormatted = new Intl.NumberFormat(locale === 'de' ? 'de-CH' : locale, {
    style: 'currency',
    currency: payload.currency,
    minimumFractionDigits: 2,
  }).format(payload.totalCents / 100)

  const html = generateEmailHtml(locale, 'orderConfirmation', {
    previewText: strings.thankYou,
    title: strings.title,
    body: strings.thankYou,
    details: [
      { label: strings.orderNumber.replace('#{orderId}', payload.orderId), value: totalFormatted },
      { label: strings.items, value: String(payload.itemCount) },
    ],
    total: totalFormatted,
    ctaText: strings.viewOrder,
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/en/account/orders`,
    registerUrl: payload.registerUrl,
  })

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: strings.subject.replace('#{orderId}', payload.orderId),
      html,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Resend send error:', err)
    return { ok: false, error: message }
  }
}

export type AbandonedCartPayload = {
  to: string
  itemCount: number
  totalCents: number
  productNames: string[]
  cartUrl: string
  locale?: string
}

export async function sendAbandonedCartEmail(
  payload: AbandonedCartPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_NOT_CONFIGURED' }
  }

  const locale = payload.locale || 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, 'abandonedCart') as any

  const html = generateEmailHtml(locale, 'abandonedCart', {
    previewText: strings.title,
    title: strings.title,
    body: strings.body,
    items: payload.productNames.map((name) => ({ name })),
    ctaText: strings.cta,
    ctaUrl: payload.cartUrl,
  })

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: strings.subject,
      html,
    })

    if (error) {
      console.error('Resend abandoned cart error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Resend send error:', err)
    return { ok: false, error: message }
  }
}

export type RestockAlertPayload = {
  to: string
  productName: string
  productUrl: string
  locale?: string
}

export async function sendRestockAlert(
  payload: RestockAlertPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'RESEND_NOT_CONFIGURED' }

  const locale = payload.locale || 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, 'restock') as any

  const html = generateEmailHtml(locale, 'restock', {
    previewText: strings.title,
    title: strings.title,
    body: strings.body,
    items: [{ name: payload.productName }],
    ctaText: strings.cta,
    ctaUrl: payload.productUrl,
  })

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: strings.subject.replace('{productName}', payload.productName),
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Resend send error:', err)
    return { ok: false, error: message }
  }
}

export type WishlistReminderPayload = {
  to: string
  wishlistUrl: string
  itemCount: number
  locale?: string
}

export async function sendWishlistReminderEmail(
  payload: WishlistReminderPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'RESEND_NOT_CONFIGURED' }

  const locale = payload.locale || 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, 'wishlist') as any

  const html = generateEmailHtml(locale, 'wishlist', {
    previewText: strings.title,
    title: strings.title,
    body: strings.body.replace('{count}', String(payload.itemCount)),
    ctaText: strings.cta,
    ctaUrl: payload.wishlistUrl,
  })

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: strings.subject,
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Resend send error:', err)
    return { ok: false, error: message }
  }
}
