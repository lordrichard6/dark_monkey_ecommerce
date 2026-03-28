// Fixed monthly operating costs in CHF cents
export const FIXED_COSTS = [
  { name: 'Vercel (Pro)', amount: 2000, note: 'Hosting & deployments' },
  { name: 'Supabase (Pro)', amount: 2000, note: 'Database & auth' },
  { name: 'Upstash Redis', amount: 0, note: 'Rate limiting (free tier)' },
  { name: 'Resend', amount: 0, note: 'Transactional emails (free tier)' },
  { name: 'Sentry', amount: 0, note: 'Error monitoring (free tier)' },
  { name: 'Cloudflare Turnstile', amount: 0, note: 'Bot protection (free)' },
  { name: 'Domain (.ch)', amount: 125, note: '~CHF 15/year amortized' },
]

export const TOTAL_FIXED_MONTHLY = FIXED_COSTS.reduce((s, c) => s + c.amount, 0)

// Stripe fee: 2.9% + CHF 0.30 per transaction (Swiss domestic)
export function calcStripeFee(totalCents: number): number {
  return Math.round(totalCents * 0.029 + 30)
}

export type AccountingOrderItem = {
  variantId: string
  productName: string
  variantName: string
  quantity: number
  salePriceCents: number
  printfulCostCents: number
  itemProfit: number
}

export type AccountingOrder = {
  id: string
  date: string
  customer: string
  revenueCents: number
  shippingCents: number
  discountCents: number
  stripeFee: number
  printfulCostCents: number
  grossProfit: number
  items: AccountingOrderItem[]
}

export type ProductProfit = {
  productId: string
  productName: string
  variantName: string
  printfulVariantId: number
  salePriceCents: number
  printfulCostCents: number
  marginCents: number
  marginPercent: number
  unitsSold: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
}

export type MonthlyData = {
  month: string // "Jan 2025"
  revenue: number
  stripeFees: number
  printfulCosts: number
  grossProfit: number
  orders: number
}

export type AccountingData = {
  orders: AccountingOrder[]
  products: ProductProfit[]
  monthly: MonthlyData[]
  allTime: {
    revenue: number
    shipping: number
    discounts: number
    stripeFees: number
    printfulCosts: number
    grossProfit: number
    netProfit: number
    orderCount: number
    avgOrderRevenue: number
    avgOrderProfit: number
  }
  thisMonth: {
    revenue: number
    stripeFees: number
    printfulCosts: number
    grossProfit: number
    netProfit: number
    orderCount: number
  }
  costCoverage: {
    ordersNeeded: number
    avgProfitPerOrder: number
  }
}
