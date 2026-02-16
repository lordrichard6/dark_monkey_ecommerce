import en from '../../messages/en.json'
import pt from '../../messages/pt.json'
import fr from '../../messages/fr.json'
import de from '../../messages/de.json'
import it from '../../messages/it.json'

const messages = { en, pt, fr, de, it }

type Locale = keyof typeof messages

export type EmailType = 'orderConfirmation' | 'abandonedCart' | 'restock' | 'wishlist'

export function getEmailStrings(locale: string, type: EmailType) {
  const safeLocale = (locale in messages ? locale : 'en') as Locale
  const emails = messages[safeLocale].email
  return {
    ...emails[type],
    footer: emails.footer
  }
}

export function generateEmailHtml(
  locale: string,
  type: EmailType,
  content: {
    previewText: string
    title: string
    body: string
    ctaUrl?: string
    ctaText?: string
    details?: { label: string; value: string }[]
    items?: { name: string; quantity?: number; price?: string }[]
    total?: string
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strings = getEmailStrings(locale, type) as any
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dark-monkey.ch'
  const logoUrl = `${appUrl}/logo.png`

  // Base colors
  const bgMain = '#ffffff'
  const textMain = '#171717'
  const textMuted = '#737373'
  const accent = '#000000'
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
    .container { max-width: 600px; margin: 0 auto; background-color: ${bgMain}; }
    .header { padding: 32px 24px; text-align: center; border-bottom: 1px solid ${border}; }
    .logo { height: 32px; width: auto; }
    .content { padding: 40px 24px; }
    .h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.025em; color: ${textMain}; }
    .p { margin: 0 0 24px; font-size: 16px; color: #404040; }
    .btn { display: inline-block; background-color: ${accent}; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; text-align: center; }
    .details { background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${border}; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: ${textMuted}; font-size: 14px; }
    .detail-value { font-weight: 500; font-size: 14px; }
    .items { margin: 24px 0; border-top: 1px solid ${border}; }
    .item-row { padding: 16px 0; border-bottom: 1px solid ${border}; display: flex; justify-content: space-between; align-items: center; }
    .item-name { font-weight: 500; font-size: 15px; }
    .item-meta { color: ${textMuted}; font-size: 14px; }
    .total-row { padding-top: 16px; display: flex; justify-content: space-between; font-weight: 700; font-size: 18px; margin-top: 16px; border-top: 2px solid ${textMain}; }
    .footer { padding: 32px 24px; text-align: center; font-size: 13px; color: ${textMuted}; background-color: #f5f5f5; }
    .footer-link { color: ${textMuted}; text-decoration: underline; }
    @media (max-width: 600px) {
      .content { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div style="background-color: #f5f5f5; padding: 20px 0;">
    <div class="container">
      <div class="header">
        <img src="${logoUrl}" alt="Dark Monkey" class="logo" />
      </div>
      
      <div class="content">
        <h1 class="h1">${content.title}</h1>
        <p class="p">${content.body}</p>

        ${content.details && content.details.length > 0 ? `
          <div class="details">
            ${content.details.map(d => `
              <div class="detail-row">
                <span class="detail-label">${d.label}</span>
                <span class="detail-value">${d.value}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${content.items && content.items.length > 0 ? `
          <div class="items">
            ${content.items.map(item => `
              <div class="item-row">
                <div>
                  <div class="item-name">${item.name}</div>
                  ${item.quantity ? `<div class="item-meta">Qty: ${item.quantity}</div>` : ''}
                </div>
                ${item.price ? `<div class="item-price">${item.price}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${content.total ? `
          <div class="total-row">
            <span>${strings.total}</span>
            <span>${content.total}</span>
          </div>
        ` : ''}

        ${content.ctaUrl ? `
          <div style="text-align: center; margin-top: 32px;">
            <a href="${content.ctaUrl}" class="btn">${content.ctaText || strings.cta}</a>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${strings.footer.address}. ${strings.footer.rights}</p>
        <p>${strings.footer.questions}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}
