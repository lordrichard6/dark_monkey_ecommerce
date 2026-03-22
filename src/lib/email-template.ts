import en from '../../messages/en.json'
import pt from '../../messages/pt.json'
import fr from '../../messages/fr.json'
import de from '../../messages/de.json'
import it from '../../messages/it.json'

const messages = { en, pt, fr, de, it }

type Locale = keyof typeof messages

export type EmailType =
  | 'orderConfirmation'
  | 'abandonedCart'
  | 'restock'
  | 'wishlist'
  | 'shipment'
  | 'passwordReset'
  | 'welcome'
  | 'emailConfirmation'
  | 'magicLink'
  | 'orderCancellation'
  | 'reviewRequest'
  | 'adminOrderAlert'

export function getEmailStrings(locale: string, type: EmailType) {
  const safeLocale = (locale in messages ? locale : 'en') as Locale
  const emails = messages[safeLocale].email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailsAny = emails as any
  return {
    ...(emailsAny[type] ?? {}),
    footer: emails.footer,
  }
}

export function generateEmailHtml(
  locale: string,
  type: EmailType | string,
  content: {
    previewText: string
    title: string
    body: string
    ctaUrl?: string
    ctaText?: string
    details?: { label: string; value: string }[]
    items?: { name: string; quantity?: number; price?: string }[]
    total?: string
    registerUrl?: string
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, type as EmailType) as any
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'
  const logoUrl = `${appUrl}/logo.png`

  // Base colors
  const bgMain = '#ffffff'
  const textMain = '#171717'
  const textMuted = '#737373'
  const accent = '#f59e0b' // amber — Dark Monkey brand
  const accentText = '#0a0a0a'
  const border = '#e5e5e5'

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; color: ${textMain}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${bgMain}; border-radius: 4px; overflow: hidden; }
    .header { padding: 28px 24px; text-align: center; background-color: #0a0a0a; }
    .logo { height: 48px; width: auto; }
    .content { padding: 40px 32px; }
    .h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.025em; color: ${textMain}; }
    .p { margin: 0 0 24px; font-size: 16px; color: #404040; }
    .btn { display: inline-block; background-color: ${accent}; color: ${accentText}; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; text-align: center; letter-spacing: -0.01em; }
    .cta-wrapper { text-align: center; margin-top: 36px; padding-top: 32px; border-top: 1px solid ${border}; }
    .details { background-color: #fafafa; border-radius: 10px; padding: 24px; margin: 24px 0; border: 1px solid ${border}; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${border}; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: ${textMuted}; font-size: 14px; }
    .detail-value { font-weight: 500; font-size: 14px; }
    .items { margin: 24px 0; border-top: 1px solid ${border}; }
    .item-row { padding: 16px 0; border-bottom: 1px solid ${border}; display: flex; justify-content: space-between; align-items: center; }
    .item-name { font-weight: 500; font-size: 15px; }
    .item-meta { color: ${textMuted}; font-size: 14px; }
    .total-row { padding-top: 16px; display: flex; justify-content: space-between; font-weight: 700; font-size: 18px; margin-top: 16px; border-top: 2px solid ${textMain}; }
    .footer { padding: 28px 24px; text-align: center; font-size: 13px; color: ${textMuted}; background-color: #0a0a0a; }
    .footer p { color: #737373; margin: 4px 0; }
    .footer-link { color: #a3a3a3; text-decoration: underline; }
    @media (max-width: 600px) {
      .content { padding: 28px 20px; }
    }
  </style>
</head>
<body>
  <div style="background-color: #f0f0f0; padding: 24px 0;">
    <div class="container">
      <div class="header">
        <img src="${logoUrl}" alt="Dark Monkey" class="logo" />
      </div>
      
      <div class="content">
        <h1 class="h1">${content.title}</h1>
        <p class="p">${content.body}</p>

        ${
          content.details && content.details.length > 0
            ? `
          <div class="details">
            ${content.details
              .map(
                (d) => `
              <div class="detail-row">
                <span class="detail-label">${d.label}</span>
                <span class="detail-value">${d.value}</span>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        ${
          content.items && content.items.length > 0
            ? `
          <div class="items">
            ${content.items
              .map(
                (item) => `
              <div class="item-row">
                <div>
                  <div class="item-name">${item.name}</div>
                  ${item.quantity ? `<div class="item-meta">${strings.footer?.qty ?? 'Qty:'} ${item.quantity}</div>` : ''}
                </div>
                ${item.price ? `<div class="item-price">${item.price}</div>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        ${
          content.total
            ? `
          <div class="total-row">
            <span>${strings.total}</span>
            <span>${content.total}</span>
          </div>
        `
            : ''
        }

        ${
          content.registerUrl
            ? `
          <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid ${border};">
            <p style="margin-bottom: 16px;">${strings.createAccount || 'Not registered yet?'}</p>
            <a href="${content.registerUrl}" style="color: ${accent}; text-decoration: underline; font-weight: 600;">
              ${strings.createAccountAction || 'Create account to track order'}
            </a>
          </div>
        `
            : ''
        }

        ${
          content.ctaUrl
            ? `
          <div class="cta-wrapper">
            <a href="${content.ctaUrl}" class="btn">${content.ctaText || strings.cta}</a>
          </div>
        `
            : ''
        }
      </div>

      <div class="footer">
        <p style="margin-bottom:8px;">
          <img src="${logoUrl}" alt="Dark Monkey" style="height:28px;width:auto;opacity:0.6;" />
        </p>
        <p>&copy; ${new Date().getFullYear()} ${strings.footer.address}. ${strings.footer.rights}</p>
        <p>${strings.footer.questions}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}
