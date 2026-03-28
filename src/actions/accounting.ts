'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { fetchCatalogVariant } from '@/lib/printful'

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

export async function getAccountingData(): Promise<AccountingData | null> {
  const supabase = getAdminClient()
  if (!supabase) return null

  // Fetch all paid orders with their items and variant details
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      guest_email,
      total_cents,
      shipping_cost_cents,
      discount_cents,
      currency,
      order_items (
        id,
        quantity,
        price_cents,
        variant_id,
        product_variants (
          id,
          name,
          printful_variant_id,
          products ( id, name )
        )
      ),
      user_profiles:user_id ( display_name, email )
    `
    )
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: false })

  if (error || !orders) return null

  // Collect unique printful_variant_ids to fetch costs
  const variantIdSet = new Set<number>()
  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      const pv = item.product_variants as unknown as { printful_variant_id?: number } | null
      if (pv?.printful_variant_id) variantIdSet.add(pv.printful_variant_id)
    }
  }

  // Fetch Printful costs (cached after first call)
  const costMap = new Map<number, number>() // printful_variant_id → cost in cents
  await Promise.all(
    Array.from(variantIdSet).map(async (variantId) => {
      const result = await fetchCatalogVariant(variantId)
      if (result.ok && result.variant?.price) {
        costMap.set(variantId, Math.round(parseFloat(result.variant.price) * 100))
      }
    })
  )

  // Build per-order data
  const accountingOrders: AccountingOrder[] = []
  const productMap = new Map<
    string,
    {
      productId: string
      productName: string
      variantName: string
      printfulVariantId: number
      salePriceCents: number
      printfulCostCents: number
      unitsSold: number
      totalRevenue: number
      totalCost: number
    }
  >()

  for (const order of orders) {
    const stripeFee = calcStripeFee(order.total_cents)
    let orderPrintfulCost = 0
    const items: AccountingOrderItem[] = []

    for (const item of order.order_items ?? []) {
      const pv = item.product_variants as unknown as {
        id: string
        name: string
        printful_variant_id?: number
        products?: { id: string; name: string } | null
      } | null

      const printfulVariantId = pv?.printful_variant_id ?? 0
      const costCents = costMap.get(printfulVariantId) ?? 0
      const totalItemCost = costCents * item.quantity
      const totalItemRevenue = item.price_cents * item.quantity
      orderPrintfulCost += totalItemCost

      const productName = (pv?.products as { name?: string } | null)?.name ?? 'Unknown'
      const variantName = pv?.name ?? 'Unknown'

      items.push({
        variantId: item.variant_id,
        productName,
        variantName,
        quantity: item.quantity,
        salePriceCents: item.price_cents,
        printfulCostCents: costCents,
        itemProfit: totalItemRevenue - totalItemCost,
      })

      // Aggregate per-product
      if (printfulVariantId) {
        const key = `${pv?.id}`
        const existing = productMap.get(key)
        if (existing) {
          existing.unitsSold += item.quantity
          existing.totalRevenue += totalItemRevenue
          existing.totalCost += totalItemCost
        } else {
          productMap.set(key, {
            productId: (pv?.products as { id?: string } | null)?.id ?? '',
            productName,
            variantName,
            printfulVariantId,
            salePriceCents: item.price_cents,
            printfulCostCents: costCents,
            unitsSold: item.quantity,
            totalRevenue: totalItemRevenue,
            totalCost: totalItemCost,
          })
        }
      }
    }

    const grossProfit = order.total_cents - stripeFee - orderPrintfulCost

    const profile = order.user_profiles as { display_name?: string; email?: string } | null
    const customer = profile?.display_name ?? profile?.email ?? order.guest_email ?? 'Guest'

    accountingOrders.push({
      id: order.id,
      date: order.created_at,
      customer,
      revenueCents: order.total_cents,
      shippingCents: order.shipping_cost_cents ?? 0,
      discountCents: order.discount_cents ?? 0,
      stripeFee,
      printfulCostCents: orderPrintfulCost,
      grossProfit,
      items,
    })
  }

  // Build products array sorted by total profit
  const products: ProductProfit[] = Array.from(productMap.values())
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      variantName: p.variantName,
      printfulVariantId: p.printfulVariantId,
      salePriceCents: p.salePriceCents,
      printfulCostCents: p.printfulCostCents,
      marginCents: p.salePriceCents - p.printfulCostCents,
      marginPercent:
        p.salePriceCents > 0
          ? Math.round(((p.salePriceCents - p.printfulCostCents) / p.salePriceCents) * 100)
          : 0,
      unitsSold: p.unitsSold,
      totalRevenue: p.totalRevenue,
      totalCost: p.totalCost,
      totalProfit: p.totalRevenue - p.totalCost,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)

  // Build monthly data
  const monthlyMap = new Map<string, MonthlyData>()
  for (const order of accountingOrders) {
    const d = new Date(order.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    const existing = monthlyMap.get(key)
    if (existing) {
      existing.revenue += order.revenueCents
      existing.stripeFees += order.stripeFee
      existing.printfulCosts += order.printfulCostCents
      existing.grossProfit += order.grossProfit
      existing.orders += 1
    } else {
      monthlyMap.set(key, {
        month: label,
        revenue: order.revenueCents,
        stripeFees: order.stripeFee,
        printfulCosts: order.printfulCostCents,
        grossProfit: order.grossProfit,
        orders: 1,
      })
    }
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  // All-time totals
  const allTimeRevenue = accountingOrders.reduce((s, o) => s + o.revenueCents, 0)
  const allTimeStripeFees = accountingOrders.reduce((s, o) => s + o.stripeFee, 0)
  const allTimePrintfulCosts = accountingOrders.reduce((s, o) => s + o.printfulCostCents, 0)
  const allTimeGrossProfit = accountingOrders.reduce((s, o) => s + o.grossProfit, 0)
  const allTimeShipping = accountingOrders.reduce((s, o) => s + o.shippingCents, 0)
  const allTimeDiscounts = accountingOrders.reduce((s, o) => s + o.discountCents, 0)
  const orderCount = accountingOrders.length

  // This month
  const now = new Date()
  const thisMonthOrders = accountingOrders.filter((o) => {
    const d = new Date(o.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + o.revenueCents, 0)
  const thisMonthStripeFees = thisMonthOrders.reduce((s, o) => s + o.stripeFee, 0)
  const thisMonthPrintfulCosts = thisMonthOrders.reduce((s, o) => s + o.printfulCostCents, 0)
  const thisMonthGrossProfit = thisMonthOrders.reduce((s, o) => s + o.grossProfit, 0)
  const thisMonthNetProfit = thisMonthGrossProfit - TOTAL_FIXED_MONTHLY

  // Cost coverage: how many orders needed to cover fixed costs
  const avgProfitPerOrder = orderCount > 0 ? Math.round(allTimeGrossProfit / orderCount) : 0
  const ordersNeeded =
    avgProfitPerOrder > 0 ? Math.ceil(TOTAL_FIXED_MONTHLY / avgProfitPerOrder) : 0

  return {
    orders: accountingOrders,
    products,
    monthly,
    allTime: {
      revenue: allTimeRevenue,
      shipping: allTimeShipping,
      discounts: allTimeDiscounts,
      stripeFees: allTimeStripeFees,
      printfulCosts: allTimePrintfulCosts,
      grossProfit: allTimeGrossProfit,
      netProfit: allTimeGrossProfit, // fixed costs are monthly, gross = best all-time metric
      orderCount,
      avgOrderRevenue: orderCount > 0 ? Math.round(allTimeRevenue / orderCount) : 0,
      avgOrderProfit: avgProfitPerOrder,
    },
    thisMonth: {
      revenue: thisMonthRevenue,
      stripeFees: thisMonthStripeFees,
      printfulCosts: thisMonthPrintfulCosts,
      grossProfit: thisMonthGrossProfit,
      netProfit: thisMonthNetProfit,
      orderCount: thisMonthOrders.length,
    },
    costCoverage: {
      ordersNeeded,
      avgProfitPerOrder,
    },
  }
}
