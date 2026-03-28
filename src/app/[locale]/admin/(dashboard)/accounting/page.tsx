import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth-admin'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { getAccountingData, FIXED_COSTS, TOTAL_FIXED_MONTHLY } from '@/actions/accounting'
import { AccountingCharts } from './accounting-charts'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accounting — Dark Monkey Admin',
  robots: { index: false, follow: false },
}

// Revalidate every 5 minutes
export const revalidate = 300

function chf(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function pct(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default async function AccountingPage() {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/login')

  const data = await getAccountingData()

  if (!data) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <p>Failed to load accounting data. Check your Printful API connection.</p>
      </div>
    )
  }

  const { allTime, thisMonth, orders, products, monthly, costCoverage } = data

  // Projection: best product × 10 orders
  const bestProduct = products[0]
  const projectionUnits = 10
  const projectionRevenue = bestProduct ? bestProduct.salePriceCents * projectionUnits : 0
  const projectionCost = bestProduct ? bestProduct.printfulCostCents * projectionUnits : 0
  const projectionStripeFees = bestProduct
    ? projectionUnits * Math.round(bestProduct.salePriceCents * 0.029 + 30)
    : 0
  const projectionProfit = projectionRevenue - projectionCost - projectionStripeFees

  const marginColor = (pct: number) =>
    pct >= 50 ? 'text-emerald-400' : pct >= 30 ? 'text-amber-400' : 'text-red-400'

  const profitColor = (cents: number) =>
    cents > 0 ? 'text-emerald-400' : cents < 0 ? 'text-red-400' : 'text-zinc-400'

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Accounting</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Real profit from every order — production costs, Stripe fees, and fixed expenses.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            Updated every 5 minutes
          </div>
        </div>

        {/* This Month KPIs */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            This Month
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Revenue',
                value: chf(thisMonth.revenue),
                sub: `${thisMonth.orderCount} order${thisMonth.orderCount !== 1 ? 's' : ''}`,
                icon: ShoppingBag,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                label: 'Stripe Fees',
                value: chf(thisMonth.stripeFees),
                sub:
                  thisMonth.revenue > 0
                    ? `${((thisMonth.stripeFees / thisMonth.revenue) * 100).toFixed(1)}% of revenue`
                    : '2.9% + CHF 0.30/order',
                icon: DollarSign,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
              },
              {
                label: 'Printful Costs',
                value: chf(thisMonth.printfulCosts),
                sub:
                  thisMonth.revenue > 0
                    ? `${((thisMonth.printfulCosts / thisMonth.revenue) * 100).toFixed(1)}% of revenue`
                    : 'Production costs',
                icon: TrendingUp,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
              },
              {
                label: 'Net Profit',
                value: chf(thisMonth.netProfit),
                sub: `After CHF ${(TOTAL_FIXED_MONTHLY / 100).toFixed(0)} fixed costs`,
                icon: TrendingUp,
                color: profitColor(thisMonth.netProfit),
                bg: thisMonth.netProfit > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}
                >
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All-Time Summary */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            All-Time Summary
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Total Revenue', value: chf(allTime.revenue) },
              { label: 'Stripe Fees', value: chf(allTime.stripeFees), red: true },
              { label: 'Printful Costs', value: chf(allTime.printfulCosts), red: true },
              {
                label: 'Gross Profit',
                value: chf(allTime.grossProfit),
                green: allTime.grossProfit > 0,
              },
              { label: 'Avg Revenue/Order', value: chf(allTime.avgOrderRevenue) },
              {
                label: 'Avg Profit/Order',
                value: chf(allTime.avgOrderProfit),
                green: allTime.avgOrderProfit > 0,
              },
            ].map(({ label, value, red, green }) => (
              <div key={label}>
                <p className="text-[11px] text-zinc-600">{label}</p>
                <p
                  className={`mt-1 text-base font-bold ${red ? 'text-red-400' : green ? 'text-emerald-400' : 'text-zinc-200'}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        {monthly.length > 0 && (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Monthly Breakdown
            </p>
            <AccountingCharts monthly={monthly} />
          </div>
        )}

        {/* Product Margins */}
        {products.length > 0 && (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Product Margins
            </p>
            <p className="mb-5 text-[11px] text-zinc-600">
              Printful wholesale cost vs. your sale price
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4 text-right">Sale Price</th>
                    <th className="pb-3 pr-4 text-right">Printful Cost</th>
                    <th className="pb-3 pr-4 text-right">Margin</th>
                    <th className="pb-3 pr-4 text-right">Margin %</th>
                    <th className="pb-3 pr-4 text-right">Units Sold</th>
                    <th className="pb-3 text-right">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {products.map((p) => (
                    <tr key={`${p.productId}-${p.variantName}`} className="text-zinc-300">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-zinc-100">{p.productName}</p>
                        <p className="text-[11px] text-zinc-600">{p.variantName}</p>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-zinc-200">
                        {chf(p.salePriceCents)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-red-400/80">
                        {p.printfulCostCents > 0 ? chf(p.printfulCostCents) : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono">
                        <span className={marginColor(p.marginPercent)}>{chf(p.marginCents)}</span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            p.marginPercent >= 50
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : p.marginPercent >= 30
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {p.marginPercent}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-zinc-400">{p.unitsSold}</td>
                      <td
                        className={`py-3 text-right font-mono font-bold ${profitColor(p.totalProfit)}`}
                      >
                        {chf(p.totalProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Projection + Fixed Costs side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fixed Monthly Costs */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Fixed Monthly Costs
            </p>
            <p className="mb-5 text-[11px] text-zinc-600">Recurring operating expenses</p>
            <div className="space-y-2">
              {FIXED_COSTS.map((cost) => (
                <div key={cost.name} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm text-zinc-300">{cost.name}</span>
                    <span className="ml-2 text-[11px] text-zinc-600">{cost.note}</span>
                  </div>
                  <span
                    className={`font-mono text-sm font-medium ${cost.amount > 0 ? 'text-red-400' : 'text-zinc-600'}`}
                  >
                    {cost.amount > 0 ? chf(cost.amount) : 'Free'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
              <span className="text-sm font-bold text-zinc-200">Total / month</span>
              <span className="font-mono text-base font-bold text-red-400">
                {chf(TOTAL_FIXED_MONTHLY)}
              </span>
            </div>
            {costCoverage.ordersNeeded > 0 && (
              <p className="mt-3 text-[11px] text-zinc-600">
                ↳ Break even at{' '}
                <span className="font-bold text-amber-400">{costCoverage.ordersNeeded} orders</span>{' '}
                / month (avg. {chf(costCoverage.avgProfitPerOrder)} profit/order)
              </p>
            )}
          </div>

          {/* Projection */}
          {bestProduct && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                Projection
              </p>
              <p className="mb-5 text-[11px] text-zinc-600">
                {projectionUnits}× <span className="text-zinc-400">{bestProduct.productName}</span>
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Gross Revenue', value: chf(projectionRevenue), color: 'text-zinc-200' },
                  {
                    label: 'Printful Costs',
                    value: `- ${chf(projectionCost)}`,
                    color: 'text-red-400',
                  },
                  {
                    label: 'Stripe Fees',
                    value: `- ${chf(projectionStripeFees)}`,
                    color: 'text-red-400',
                  },
                  {
                    label: 'Fixed Costs / month',
                    value: `- ${chf(TOTAL_FIXED_MONTHLY)}`,
                    color: 'text-orange-400',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{label}</span>
                    <span className={`font-mono text-sm font-medium ${color}`}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="text-sm font-bold text-zinc-200">Net Profit</span>
                  <span
                    className={`font-mono text-lg font-bold ${profitColor(projectionProfit - TOTAL_FIXED_MONTHLY)}`}
                  >
                    {chf(projectionProfit - TOTAL_FIXED_MONTHLY)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-zinc-600">
                Margin: {bestProduct.marginPercent}% per unit · Best selling product
              </p>
            </div>
          )}
        </div>

        {/* Cash Flow Timeline */}
        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-400 mb-3">Cash Flow Timeline</p>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-400">
                {[
                  { step: '1', label: 'Customer pays', sub: 'Day 0' },
                  { step: '2', label: 'Stripe holds funds', sub: '~2–7 days' },
                  {
                    step: '3',
                    label: 'Printful fulfills order',
                    sub: '2–5 business days production',
                  },
                  { step: '4', label: 'Stripe payout to bank', sub: '2–3 business days' },
                  { step: '5', label: 'Funds available', sub: 'Day 7–14 total' },
                ].map(({ step, label, sub }, i, arr) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                        {step}
                      </div>
                      <p className="mt-1 text-center text-[11px] font-medium text-zinc-300 max-w-[80px]">
                        {label}
                      </p>
                      <p className="text-center text-[10px] text-zinc-600">{sub}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-700 mb-4 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-zinc-600">
                Printful production costs are charged automatically when an order is sent to
                fulfillment. Stripe payouts typically settle within 2–3 business days for verified
                Swiss accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Order-by-Order Breakdown */}
        {orders.length > 0 && (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Order Breakdown
            </p>
            <p className="mb-5 text-[11px] text-zinc-600">Profit per order after all costs</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4 text-right">Revenue</th>
                    <th className="pb-3 pr-4 text-right">Stripe Fee</th>
                    <th className="pb-3 pr-4 text-right">Printful Cost</th>
                    <th className="pb-3 text-right">Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-zinc-300">
                      <td className="py-3 pr-4 text-zinc-500 text-[12px]">
                        {new Date(order.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-4 max-w-[140px] truncate text-zinc-300">
                        {order.customer}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-zinc-200">
                        {chf(order.revenueCents)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-red-400/80">
                        -{chf(order.stripeFee)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-red-400/80">
                        {order.printfulCostCents > 0 ? `-${chf(order.printfulCostCents)}` : '—'}
                      </td>
                      <td
                        className={`py-3 text-right font-mono font-bold ${profitColor(order.grossProfit)}`}
                      >
                        {chf(order.grossProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 font-bold text-zinc-200">
                    <td
                      className="pt-4 pr-4 text-[11px] uppercase tracking-wider text-zinc-600"
                      colSpan={2}
                    >
                      Total
                    </td>
                    <td className="pt-4 pr-4 text-right font-mono">{chf(allTime.revenue)}</td>
                    <td className="pt-4 pr-4 text-right font-mono text-red-400">
                      -{chf(allTime.stripeFees)}
                    </td>
                    <td className="pt-4 pr-4 text-right font-mono text-red-400">
                      -{chf(allTime.printfulCosts)}
                    </td>
                    <td
                      className={`pt-4 text-right font-mono text-lg ${profitColor(allTime.grossProfit)}`}
                    >
                      {chf(allTime.grossProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              No paid orders yet. This page will populate automatically as orders come in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
