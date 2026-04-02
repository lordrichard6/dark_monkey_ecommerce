'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { fetchStoreOrder } from '@/lib/printful'
import {
  calcStripeFee,
  TOTAL_FIXED_MONTHLY,
  type AccountingOrder,
  type AccountingOrderItem,
  type AccountingData,
  type ProductProfit,
  type MonthlyData,
} from '@/lib/accounting-utils'

const PRINTFUL_BATCH_SIZE = 5

export async function getAccountingData(): Promise<AccountingData | null> {
  const supabase = getAdminClient()
  if (!supabase) return null

  // Fetch all paid orders with their items and variant details.
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
      user_id,
      printful_order_id,
      order_items (
        id,
        quantity,
        price_cents,
        variant_id,
        printful_item_cost_cents,
        product_variants (
          id,
          name,
          printful_variant_id,
          products ( id, name )
        )
      )
    `
    )
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error || !orders) {
    console.error('[accounting] orders query failed:', error)
    return null
  }

  // Fetch cached Printful costs in a separate resilient query.
  // Separated so that a schema-cache miss never breaks the main page load.
  const printfulCostMap = new Map<string, number>()
  try {
    const { data: costRows } = await supabase
      .from('orders')
      .select('id, printful_cost_cents')
      .in(
        'id',
        orders.map((o) => o.id)
      )
    for (const row of costRows ?? []) {
      const cost = (row as { printful_cost_cents?: number | null }).printful_cost_cents
      // Only treat as "synced" if cost is a positive number — 0 means it was saved
      // before Printful had priced the order (draft state) and needs re-syncing.
      if (cost != null && cost > 0) printfulCostMap.set(row.id, cost)
    }
  } catch {
    // Schema cache not refreshed yet — costs will be 0 until next sync
  }

  // Fetch user profiles for logged-in customers
  const userIds = [
    ...new Set(orders.map((o) => (o as { user_id?: string }).user_id).filter(Boolean)),
  ] as string[]
  const profileMap = new Map<string, { display_name?: string; email?: string }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { display_name: p.display_name, email: p.email })
    }
  }

  // Count orders that have a printful_order_id but no cached cost yet
  const unsyncedCount = orders.filter(
    (o) =>
      (o as { printful_order_id?: number }).printful_order_id != null && !printfulCostMap.has(o.id)
  ).length

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
    const items: AccountingOrderItem[] = []

    // Use cached Printful cost from the separate cost map
    const orderPrintfulCost = printfulCostMap.get(order.id) ?? 0

    // Calculate total item revenue for proportional cost allocation
    const orderItems = order.order_items ?? []
    const totalOrderItemRevenue = orderItems.reduce(
      (s, item) => s + item.price_cents * item.quantity,
      0
    )

    for (const item of orderItems) {
      const pv = item.product_variants as unknown as {
        id: string
        name: string
        printful_variant_id?: number
        products?: { id: string; name: string } | null
      } | null

      const printfulVariantId = pv?.printful_variant_id ?? 0
      const totalItemRevenue = item.price_cents * item.quantity

      const productName = (pv?.products as { name?: string } | null)?.name ?? 'Unknown'
      const variantName = pv?.name ?? 'Unknown'

      // Use per-item Printful cost if synced (items[].price from Printful API).
      // This is the pure fulfillment cost per unit, excluding shipping and VAT.
      // Fall back to proportional allocation of the order-level cost if not available.
      const storedItemCost = (item as unknown as { printful_item_cost_cents?: number | null })
        .printful_item_cost_cents
      const allocatedPrintfulCost =
        storedItemCost != null && storedItemCost > 0
          ? storedItemCost * item.quantity
          : totalOrderItemRevenue > 0 && orderPrintfulCost > 0
            ? Math.round((totalItemRevenue / totalOrderItemRevenue) * orderPrintfulCost)
            : 0

      items.push({
        variantId: item.variant_id,
        productName,
        variantName,
        quantity: item.quantity,
        salePriceCents: item.price_cents,
        printfulCostCents: allocatedPrintfulCost,
        itemProfit: totalItemRevenue - allocatedPrintfulCost,
      })

      // Aggregate per-product with proportional cost allocation
      if (printfulVariantId) {
        const key = `${pv?.id}`
        const existing = productMap.get(key)
        if (existing) {
          existing.unitsSold += item.quantity
          existing.totalRevenue += totalItemRevenue
          existing.totalCost += allocatedPrintfulCost
        } else {
          productMap.set(key, {
            productId: (pv?.products as { id?: string } | null)?.id ?? '',
            productName,
            variantName,
            printfulVariantId,
            salePriceCents: item.price_cents,
            // storedItemCost is per-unit; use it directly if available so the avg stays accurate
            printfulCostCents: storedItemCost != null && storedItemCost > 0 ? storedItemCost : 0,
            unitsSold: item.quantity,
            totalRevenue: totalItemRevenue,
            totalCost: allocatedPrintfulCost,
          })
        }
      }
    }

    const grossProfit = order.total_cents - stripeFee - orderPrintfulCost

    const userId = (order as { user_id?: string }).user_id
    const profile = userId ? profileMap.get(userId) : null
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

  // Build products array — set printfulCostCents as avg cost per unit
  const products: ProductProfit[] = Array.from(productMap.values())
    .map((p) => {
      const printfulCostCents = p.unitsSold > 0 ? Math.round(p.totalCost / p.unitsSold) : 0
      return {
        productId: p.productId,
        productName: p.productName,
        variantName: p.variantName,
        printfulVariantId: p.printfulVariantId,
        salePriceCents: p.salePriceCents,
        printfulCostCents,
        marginCents: p.salePriceCents - printfulCostCents,
        marginPercent:
          p.salePriceCents > 0 && printfulCostCents > 0
            ? Math.round(((p.salePriceCents - printfulCostCents) / p.salePriceCents) * 100)
            : 0,
        unitsSold: p.unitsSold,
        totalRevenue: p.totalRevenue,
        totalCost: p.totalCost,
        totalProfit: p.totalRevenue - p.totalCost,
      }
    })
    .sort((a, b) => b.totalProfit - a.totalProfit)

  // Build monthly data using Europe/Zurich timezone
  const monthlyMap = new Map<string, MonthlyData>()
  for (const order of accountingOrders) {
    const localDate = new Date(order.date).toLocaleDateString('en-CA', {
      timeZone: 'Europe/Zurich',
    })
    const [year, month] = localDate.split('-').map(Number)
    const key = `${year}-${String(month).padStart(2, '0')}`
    const label = new Date(order.date).toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/Zurich',
    })
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

  // All-time net profit = gross profit minus all fixed costs over active months
  const allTimeFixedCosts = monthlyMap.size * TOTAL_FIXED_MONTHLY
  const allTimeNetProfit = allTimeGrossProfit - allTimeFixedCosts

  // This month — filtered using Europe/Zurich timezone
  const nowZurich = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
  const [thisYear, thisMonthNum] = nowZurich.split('-').map(Number)
  const thisMonthOrders = accountingOrders.filter((o) => {
    const d = new Date(o.date).toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
    const [y, m] = d.split('-').map(Number)
    return y === thisYear && m === thisMonthNum
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
    unsyncedCount,
    allTime: {
      revenue: allTimeRevenue,
      shipping: allTimeShipping,
      discounts: allTimeDiscounts,
      stripeFees: allTimeStripeFees,
      printfulCosts: allTimePrintfulCosts,
      grossProfit: allTimeGrossProfit,
      netProfit: allTimeNetProfit,
      fixedCosts: allTimeFixedCosts,
      activeMonths: monthlyMap.size,
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

/**
 * Backfills printful_cost_cents for orders that have a printful_order_id but
 * no cached cost yet. Called from the admin sync button — not during page render.
 * Returns { synced, failed } counts.
 */
export async function syncPrintfulCosts(): Promise<{ synced: number; failed: number }> {
  const supabase = getAdminClient()
  if (!supabase) return { synced: 0, failed: 0 }

  // Find orders that have a Printful order ID but no valid cost yet.
  // Also re-sync orders where cost is 0 — that means they were saved while still a draft.
  const { data: pending, error } = await supabase
    .from('orders')
    .select('id, printful_order_id')
    .not('printful_order_id', 'is', null)
    .or('printful_cost_cents.is.null,printful_cost_cents.eq.0')
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  if (error || !pending || pending.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (let i = 0; i < pending.length; i += PRINTFUL_BATCH_SIZE) {
    const batch = pending.slice(i, i + PRINTFUL_BATCH_SIZE)
    await Promise.all(
      batch.map(async (order) => {
        const printfulOrderId = (order as { printful_order_id?: number }).printful_order_id
        if (!printfulOrderId) {
          failed++
          return
        }

        const result = await fetchStoreOrder(printfulOrderId)
        if (result.ok && result.order?.costs?.total) {
          const costCents = Math.round(parseFloat(result.order.costs.total) * 100)
          const { error: updateError } = await supabase
            .from('orders')
            .update({ printful_cost_cents: costCents })
            .eq('id', order.id)
          if (updateError) {
            failed++
            return
          }

          // --- Per-item cost sync ---
          // Fetch local order items with their variant's Printful IDs so we can match
          // to the Printful order items by sync_variant_id / variant_id.
          const { data: localItems } = await supabase
            .from('order_items')
            .select('id, product_variants(printful_variant_id, printful_sync_variant_id)')
            .eq('order_id', order.id)

          if (localItems && result.order.items?.length) {
            // Build lookup: printful variant id → local order_item.id
            const variantToItemId = new Map<number, string>()
            for (const li of localItems) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pv = (li as any).product_variants
              const syncId: number | null = pv?.printful_sync_variant_id ?? null
              const varId: number | null = pv?.printful_variant_id ?? null
              if (syncId) variantToItemId.set(syncId, li.id)
              else if (varId) variantToItemId.set(varId, li.id)
            }

            // Match each Printful item to a local order item and write per-item cost
            await Promise.all(
              result.order.items.map(async (pItem) => {
                const pfVariantId = pItem.sync_variant_id ?? pItem.variant_id
                if (!pfVariantId || !pItem.price) return
                const localItemId = variantToItemId.get(pfVariantId)
                if (!localItemId) return
                const itemCostCents = Math.round(parseFloat(pItem.price) * 100)
                await supabase
                  .from('order_items')
                  .update({ printful_item_cost_cents: itemCostCents })
                  .eq('id', localItemId)
              })
            )
          }

          synced++
        } else {
          failed++
        }
      })
    )
  }

  return { synced, failed }
}
