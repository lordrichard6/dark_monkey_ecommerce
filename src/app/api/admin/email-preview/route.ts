import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth-admin'
import { generateEmailHtml } from '@/lib/email-template'

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') ?? 'order'
  const locale = searchParams.get('locale') ?? 'en'

  const html = getPreviewHtml(type, locale)
  return NextResponse.json({ html })
}

function getPreviewHtml(type: string, locale: string): string {
  const orderId = 'PREVIEW-1234'
  const total = locale === 'pt' ? 'CHF 129,00' : 'CHF 129.00'

  switch (type) {
    case 'order':
      return generateEmailHtml(locale, 'orderConfirmation', {
        previewText: `Order confirmed — #${orderId}`,
        title: locale === 'pt' ? 'Encomenda Confirmada' : 'Order Confirmed',
        body:
          locale === 'pt'
            ? 'Obrigado pela tua encomenda. Estamos a prepará-la com cuidado.'
            : 'Thank you for your order. We are preparing it with care.',
        details: [
          { label: locale === 'pt' ? 'Nº de encomenda' : 'Order number', value: `#${orderId}` },
          { label: locale === 'pt' ? 'Total' : 'Total', value: total },
          { label: locale === 'pt' ? 'Artigos' : 'Items', value: '3' },
        ],
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Ver Encomenda' : 'View Order',
      })
    case 'cancellation':
      return generateEmailHtml(locale, 'orderCancellation', {
        previewText: `Order cancelled — #${orderId}`,
        title: locale === 'pt' ? 'Encomenda Cancelada' : 'Order Cancelled',
        body:
          locale === 'pt'
            ? 'A tua encomenda foi cancelada. O reembolso será processado em 5–10 dias úteis.'
            : 'Your order has been cancelled. A refund will be processed within 5–10 business days.',
        details: [
          { label: 'Order', value: `#${orderId}` },
          { label: 'Total', value: total },
        ],
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Ver Histórico' : 'View Order History',
      })
    case 'shipment':
      return generateEmailHtml(locale, 'shipment', {
        previewText: `Your order has shipped — #${orderId}`,
        title: locale === 'pt' ? 'A tua encomenda foi enviada!' : 'Your Order Has Shipped!',
        body:
          locale === 'pt'
            ? 'A tua encomenda está a caminho.'
            : 'Great news! Your order has been dispatched.',
        details: [
          { label: 'Order', value: `#${orderId}` },
          { label: locale === 'pt' ? 'Tracking' : 'Tracking', value: 'CH123456789' },
          { label: locale === 'pt' ? 'Transportadora' : 'Carrier', value: 'Swiss Post' },
        ],
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Rastrear Encomenda' : 'Track Your Package',
      })
    case 'abandoned-cart':
      return generateEmailHtml(locale, 'abandonedCart', {
        previewText: locale === 'pt' ? 'Deixaste algo para trás' : 'You left something behind',
        title: locale === 'pt' ? 'Deixaste algo para trás' : 'You Left Something Behind',
        body:
          locale === 'pt'
            ? 'A tua seleção premium está reservada.'
            : 'Your premium selection is reserved. Complete your order now.',
        items: [
          { name: 'Unisex Hoodie — Dark Monkey', quantity: 1 },
          { name: 'Snap Case for iPhone', quantity: 2 },
        ],
        total,
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Completar Encomenda' : 'Complete Order',
      })
    case 'restock':
      return generateEmailHtml(locale, 'restock', {
        previewText:
          locale === 'pt'
            ? 'Está de volta: Limited Edition Bomber'
            : 'Back in Stock: Limited Edition Bomber',
        title: locale === 'pt' ? 'Está de Volta' : "It's Back",
        body:
          locale === 'pt'
            ? 'O artigo que procuravas está disponível novamente.'
            : "The item you were looking for is available again. Don't miss out.",
        details: [
          {
            label: locale === 'pt' ? 'Produto' : 'Product',
            value: 'Limited Edition Bomber Jacket',
          },
        ],
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Comprar Agora' : 'Shop Now',
      })
    case 'wishlist':
      return generateEmailHtml(locale, 'wishlist', {
        previewText:
          locale === 'pt' ? 'A tua lista de desejos está à espera' : 'Your wishlist is waiting',
        title: locale === 'pt' ? 'Guardado para Ti' : 'Saved for You',
        body:
          locale === 'pt'
            ? 'Tens 5 artigos na tua lista de desejos. Dá uma vista de olhos antes que se esgotem.'
            : "You have 5 items in your wishlist. Take a look before they're gone.",
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Ver Lista' : 'View Wishlist',
      })
    case 'welcome':
      return generateEmailHtml(locale, 'welcome', {
        previewText: locale === 'pt' ? 'A tua aventura começa aqui' : 'Your adventure starts here',
        title: locale === 'pt' ? 'Bem-vindo à Família' : 'Welcome to the Family',
        body:
          locale === 'pt'
            ? 'A tua conta está pronta. Explora as nossas coleções exclusivas e encontra o teu estilo.'
            : 'Your account is ready. Explore our exclusive collections and find your style.',
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Começar a Comprar' : 'Start Shopping',
      })
    case 'review-request':
      return generateEmailHtml(locale, 'reviewRequest', {
        previewText:
          locale === 'pt' ? 'Adorávamos saber a tua opinião' : "We'd love to hear what you think",
        title: locale === 'pt' ? 'Como Correu?' : 'How Did We Do?',
        body:
          locale === 'pt'
            ? 'Esperamos que estejas a adorar os teus novos artigos!'
            : "We hope you're loving your new items! Share your experience.",
        items: [{ name: 'Unisex Hoodie — Dark Monkey', quantity: 1 }],
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Deixar Avaliação' : 'Leave a Review',
      })
    case 'password-reset':
      return generateEmailHtml(locale, 'passwordReset', {
        previewText: locale === 'pt' ? 'Redefinição de palavra-passe' : 'Password reset request',
        title: locale === 'pt' ? 'Redefine a tua Palavra-passe' : 'Reset Your Password',
        body:
          locale === 'pt'
            ? 'Solicitaste uma redefinição de palavra-passe. Clica no botão abaixo. Este link expira em 1 hora.'
            : 'You requested a password reset. Click the button below. This link expires in 1 hour.',
        ctaUrl: '#',
        ctaText: locale === 'pt' ? 'Redefinir Palavra-passe' : 'Reset Password',
      })
    case 'admin-order-alert':
      return generateEmailHtml('en', 'adminOrderAlert', {
        previewText: `New order #${orderId} — ${total}`,
        title: '🛒 New Order Received',
        body: 'A new order has been placed on Dark Monkey.',
        details: [
          { label: 'Order ID', value: `#${orderId}` },
          { label: 'Customer', value: 'customer@example.com' },
          { label: 'Items', value: '3' },
          { label: 'Total', value: total },
        ],
        ctaUrl: '#',
        ctaText: 'View in Admin',
      })
    default:
      return '<p>Unknown email type</p>'
  }
}
