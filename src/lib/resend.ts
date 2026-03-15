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

export type ShipmentPayload = {
  to: string
  orderId: string
  trackingNumber: string
  trackingUrl: string
  carrier?: string
  locale?: string
}

export async function sendShipmentEmail(
  payload: ShipmentPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'RESEND_NOT_CONFIGURED' }

  const locale = payload.locale || 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, 'shipment') as any

  const details: { label: string; value: string }[] = [
    { label: strings.trackingLabel, value: payload.trackingNumber },
  ]
  if (payload.carrier) {
    details.push({ label: strings.carrierLabel, value: payload.carrier })
  }

  const html = generateEmailHtml(locale, 'shipment', {
    previewText: strings.title,
    title: strings.title,
    body: strings.body,
    details,
    ctaText: strings.cta,
    ctaUrl: payload.trackingUrl,
  })

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: strings.subject.replace('#{orderId}', payload.orderId.slice(0, 8).toUpperCase()),
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

export type PasswordResetPayload = {
  to: string
  resetUrl: string
  locale?: string
}

export async function sendPasswordResetEmail(
  payload: PasswordResetPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'RESEND_NOT_CONFIGURED' }

  const locale = payload.locale || 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, 'passwordReset') as any

  const html = generateEmailHtml(locale, 'passwordReset', {
    previewText: strings.title,
    title: strings.title,
    body: `${strings.body}<br><br><small style="color:#737373;">${strings.ignore}</small>`,
    ctaText: strings.cta,
    ctaUrl: payload.resetUrl,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://dark-monkey.ch'
}

function formatCurrency(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

function getEmailString(locale: string, key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messages = require(`../../messages/${locale}.json`) as Record<string, unknown>
    const emailSection = (messages.email ?? {}) as Record<string, unknown>
    const parts = key.split('.')
    let val: unknown = emailSection
    for (const part of parts) {
      val = (val as Record<string, unknown>)[part]
    }
    if (typeof val === 'string') return val
  } catch {
    /* fallback */
  }
  if (locale !== 'en') return getEmailString('en', key)
  return key
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export interface WelcomePayload {
  to: string
  firstName?: string
  locale?: string
}

export async function sendWelcomeEmail(payload: WelcomePayload): Promise<boolean> {
  const client = getResendClient()
  if (!client) return false
  const { to, firstName, locale = 'en' } = payload
  try {
    const html = generateEmailHtml(locale, 'welcome', {
      previewText: getEmailString(locale, 'welcome.preview'),
      title: getEmailString(locale, 'welcome.title'),
      body: firstName
        ? getEmailString(locale, 'welcome.bodyWithName').replace('{name}', firstName)
        : getEmailString(locale, 'welcome.body'),
      ctaUrl: `${getBaseUrl()}/${locale}`,
      ctaText: getEmailString(locale, 'welcome.cta'),
    })
    await client.emails.send({
      from: getDefaultFrom(),
      to,
      subject: getEmailString(locale, 'welcome.subject'),
      html,
    })
    return true
  } catch (err) {
    console.error('[sendWelcomeEmail]', err)
    return false
  }
}

// ─── Order cancellation email ─────────────────────────────────────────────────

export interface OrderCancellationPayload {
  to: string
  orderId: string
  totalCents: number
  currency: string
  locale?: string
}

export async function sendOrderCancellationEmail(
  payload: OrderCancellationPayload
): Promise<boolean> {
  const client = getResendClient()
  if (!client) return false
  const { to, orderId, totalCents, currency, locale = 'en' } = payload
  try {
    const total = formatCurrency(totalCents, currency, locale)
    const html = generateEmailHtml(locale, 'orderCancellation', {
      previewText: getEmailString(locale, 'orderCancellation.preview').replace(
        '{orderId}',
        orderId.slice(0, 8).toUpperCase()
      ),
      title: getEmailString(locale, 'orderCancellation.title'),
      body: getEmailString(locale, 'orderCancellation.body'),
      details: [
        {
          label: getEmailString(locale, 'orderConfirmation.orderNumber'),
          value: `#${orderId.slice(0, 8).toUpperCase()}`,
        },
        { label: getEmailString(locale, 'orderConfirmation.total'), value: total },
      ],
      ctaUrl: `${getBaseUrl()}/${locale}/account/orders`,
      ctaText: getEmailString(locale, 'orderCancellation.cta'),
    })
    await client.emails.send({
      from: getDefaultFrom(),
      to,
      subject: getEmailString(locale, 'orderCancellation.subject').replace(
        '{orderId}',
        orderId.slice(0, 8).toUpperCase()
      ),
      html,
    })
    return true
  } catch (err) {
    console.error('[sendOrderCancellationEmail]', err)
    return false
  }
}

// ─── Review request email ─────────────────────────────────────────────────────

export interface ReviewRequestPayload {
  to: string
  orderId: string
  productNames: string[]
  locale?: string
}

export async function sendReviewRequestEmail(payload: ReviewRequestPayload): Promise<boolean> {
  const client = getResendClient()
  if (!client) return false
  const { to, orderId, productNames, locale = 'en' } = payload
  try {
    const html = generateEmailHtml(locale, 'reviewRequest', {
      previewText: getEmailString(locale, 'reviewRequest.preview'),
      title: getEmailString(locale, 'reviewRequest.title'),
      body: getEmailString(locale, 'reviewRequest.body'),
      items: productNames.map((name) => ({ name, quantity: 1 })),
      ctaUrl: `${getBaseUrl()}/${locale}/account/orders/${orderId}`,
      ctaText: getEmailString(locale, 'reviewRequest.cta'),
    })
    await client.emails.send({
      from: getDefaultFrom(),
      to,
      subject: getEmailString(locale, 'reviewRequest.subject'),
      html,
    })
    return true
  } catch (err) {
    console.error('[sendReviewRequestEmail]', err)
    return false
  }
}

// ─── Admin new order alert ────────────────────────────────────────────────────

export interface AdminOrderAlertPayload {
  orderId: string
  customerEmail: string
  totalCents: number
  currency: string
  itemCount: number
}

export async function sendAdminOrderAlert(payload: AdminOrderAlertPayload): Promise<boolean> {
  const client = getResendClient()
  if (!client) return false
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) return false
  const { orderId, customerEmail, totalCents, currency, itemCount } = payload
  try {
    const total = formatCurrency(totalCents, currency, 'en')
    const html = generateEmailHtml('en', 'adminOrderAlert', {
      previewText: `New order #${orderId.slice(0, 8).toUpperCase()} — ${total}`,
      title: '🛒 New Order Received',
      body: 'A new order has been placed on Dark Monkey.',
      details: [
        { label: 'Order ID', value: `#${orderId.slice(0, 8).toUpperCase()}` },
        { label: 'Customer', value: customerEmail },
        { label: 'Items', value: String(itemCount) },
        { label: 'Total', value: total },
      ],
      ctaUrl: `${getBaseUrl()}/en/admin/orders`,
      ctaText: 'View in Admin',
    })
    await client.emails.send({
      from: getDefaultFrom(),
      to: adminEmail,
      subject: `[Dark Monkey] New Order #${orderId.slice(0, 8).toUpperCase()} — ${total}`,
      html,
    })
    return true
  } catch (err) {
    console.error('[sendAdminOrderAlert]', err)
    return false
  }
}
