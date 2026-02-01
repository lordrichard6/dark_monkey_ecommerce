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
