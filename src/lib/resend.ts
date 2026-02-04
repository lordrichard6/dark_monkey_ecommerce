import { Resend } from 'resend'

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
}

export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_NOT_CONFIGURED' }
  }

  const totalFormatted = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: payload.currency,
    minimumFractionDigits: 2,
  }).format(payload.totalCents / 100)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #171717;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Order confirmed</h1>
  <p style="color: #525252; line-height: 1.6;">
    Thank you for your order. We're processing it and will ship soon.
  </p>
  <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0; font-weight: 600;">Order #${payload.orderId.slice(0, 8)}</p>
    <p style="margin: 8px 0 0; color: #525252;">
      ${payload.itemCount} item${payload.itemCount !== 1 ? 's' : ''} · ${totalFormatted}
    </p>
  </div>
  <p style="color: #737373; font-size: 14px;">
    Questions? Reply to this email or visit our store.
  </p>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: `Order confirmed — #${payload.orderId.slice(0, 8)}`,
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
}

export async function sendAbandonedCartEmail(
  payload: AbandonedCartPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_NOT_CONFIGURED' }
  }

  const totalFormatted = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(payload.totalCents / 100)

  const productList =
    payload.productNames.length > 0
      ? `<ul style="margin: 8px 0 0; padding-left: 20px;">${payload.productNames.map((n) => `<li>${n}</li>`).join('')}</ul>`
      : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #171717;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">You left something behind</h1>
  <p style="color: #525252; line-height: 1.6;">
    Your cart is still waiting — ${payload.itemCount} item${payload.itemCount !== 1 ? 's' : ''} · ${totalFormatted}
  </p>
  ${productList ? `<div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">${productList}</div>` : ''}
  <p style="margin: 24px 0;">
    <a href="${payload.cartUrl}" style="display: inline-block; background: #171717; color: #fafafa; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Complete your order</a>
  </p>
  <p style="color: #737373; font-size: 14px;">
    Questions? Reply to this email or visit our store.
  </p>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: 'Your cart is waiting — complete your order',
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type RestockAlertPayload = {
  to: string
  productName: string
  productUrl: string
}

export async function sendRestockAlert(
  payload: RestockAlertPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'RESEND_NOT_CONFIGURED' }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #171717;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Back in stock</h1>
  <p style="color: #525252; line-height: 1.6;">
    <strong>${escapeHtml(payload.productName)}</strong> is back in stock.
  </p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(payload.productUrl)}" style="display: inline-block; background: #171717; color: #fafafa; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View product</a>
  </p>
  <p style="color: #737373; font-size: 14px;">
    You received this because you saved this item to your wishlist.
  </p>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: `Back in stock: ${payload.productName}`,
      html,
    })
    if (error) {
      console.error('Resend restock error:', error)
      return { ok: false, error: error.message }
    }
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
}

export async function sendWishlistReminderEmail(
  payload: WishlistReminderPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'RESEND_NOT_CONFIGURED' }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #171717;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Your saved items are waiting</h1>
  <p style="color: #525252; line-height: 1.6;">
    You have ${payload.itemCount} item${payload.itemCount !== 1 ? 's' : ''} in your wishlist. Don't miss out — they might not be there forever.
  </p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(payload.wishlistUrl)}" style="display: inline-block; background: #171717; color: #fafafa; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View wishlist</a>
  </p>
  <p style="color: #737373; font-size: 14px;">
    You received this because you have items saved for later.
  </p>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: payload.to,
      subject: `You have ${payload.itemCount} saved item${payload.itemCount !== 1 ? 's' : ''} — view your wishlist`,
      html,
    })
    if (error) {
      console.error('Resend wishlist reminder error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Resend send error:', err)
    return { ok: false, error: message }
  }
}
