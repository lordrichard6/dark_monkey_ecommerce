import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getAdminUser } from '@/lib/auth-admin'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { getAccountingData } from '@/actions/accounting'
import { FIXED_COSTS, TOTAL_FIXED_MONTHLY } from '@/lib/accounting-utils'
import { AccountingCharts } from './accounting-charts'
import { SyncPrintfulCostsButton } from './sync-button'
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

function chf(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export default async function AccountingPage() {
  const t = await getTranslations('admin')

  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-4 sm:p-8">
        <AdminNotConfigured />
      </div>
    )

  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/login')

  const data = await getAccountingData()

  if (!data) {
    return (
      <div className="p-4 sm:p-8 flex items-center gap-3 text-zinc-400">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <p>Failed to load accounting data. Check your Printful API connection.</p>
      </div>
    )
  }

  const { allTime, thisMonth, orders, products, monthly, costCoverage, unsyncedCount } = data

  // Projection: best product × 10 orders
  const bestProduct = products[0]
  const projectionUnits = 10
  const projectionRevenue = bestProduct ? bestProduct.salePriceCents * projectionUnits : 0
  const projectionCost = bestProduct ? bestProduct.printfulCostCents * projectionUnits : 0
  const projectionStripeFees = bestProduct
    ? projectionUnits * Math.round(bestProduct.salePriceCents * 0.015 + 30)
    : 0
  const projectionGrossProfit = projectionRevenue - projectionCost - projectionStripeFees

  const marginColor = (marginPct: number) =>
    marginPct >= 50 ? 'text-emerald-400' : marginPct >= 30 ? 'text-amber-400' : 'text-red-400'

  const profitColor = (cents: number) =>
    cents > 0 ? 'text-emerald-400' : cents < 0 ? 'text-red-400' : 'text-zinc-400'

  return (
    <div className="p-4 sm:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-zinc-50">
              {t('accounting.title')}
            </h1>
            <p className="mt-1 text-[11px] sm:text-xs text-zinc-500">{t('accounting.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-zinc-400">
            <Clock className="h-3 w-3" />
            {t('accounting.liveData')}
          </div>
        </div>

        {/* Sync Printful costs banner */}
        {unsyncedCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[12px] text-amber-300">
                {t('accounting.unsyncedWarning', { n: unsyncedCount })}
              </p>
            </div>
            <SyncPrintfulCostsButton unsyncedCount={unsyncedCount} />
          </div>
        )}

        {/* This Month KPIs */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            {t('accounting.thisMonth')}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              {
                label: t('accounting.revenue'),
                value: chf(thisMonth.revenue),
                sub: t('accounting.orders', { n: thisMonth.orderCount }),
                icon: ShoppingBag,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                accent: 'border-t-amber-500/60',
              },
              {
                label: t('accounting.stripeFees'),
                value: chf(thisMonth.stripeFees),
                sub:
                  thisMonth.revenue > 0
                    ? t('accounting.ofRevenue', {
                        pct: ((thisMonth.stripeFees / thisMonth.revenue) * 100).toFixed(1),
                      })
                    : t('accounting.stripeFeesNote'),
                icon: DollarSign,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                accent: 'border-t-red-500/50',
              },
              {
                label: t('accounting.printfulCosts'),
                value: chf(thisMonth.printfulCosts),
                sub:
                  thisMonth.revenue > 0
                    ? t('accounting.ofRevenue', {
                        pct: ((thisMonth.printfulCosts / thisMonth.revenue) * 100).toFixed(1),
                      })
                    : 'Production costs',
                icon: TrendingUp,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                accent: 'border-t-orange-500/50',
              },
              {
                label: t('accounting.netProfit'),
                value: chf(thisMonth.netProfit),
                sub: t('accounting.afterFixedCosts', {
                  amount: (TOTAL_FIXED_MONTHLY / 100).toFixed(0),
                }),
                icon: TrendingUp,
                color: profitColor(thisMonth.netProfit),
                bg: thisMonth.netProfit > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                accent: thisMonth.netProfit > 0 ? 'border-t-emerald-500/50' : 'border-t-red-500/50',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg, accent }) => (
              <div
                key={label}
                className={`rounded-xl border border-zinc-800 border-t-2 ${accent} bg-zinc-900/50 p-4 sm:p-6`}
              >
                <div
                  className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500">{label}</p>
                <p className={`mt-1 text-lg sm:text-2xl font-bold leading-tight ${color}`}>
                  {value}
                </p>
                <p className="mt-1 text-[10px] sm:text-[11px] text-zinc-600 leading-snug">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All-Time Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {t('accounting.allTimeSummary')}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: t('accounting.totalRevenue'), value: chf(allTime.revenue) },
              { label: t('accounting.stripeFees'), value: chf(allTime.stripeFees), red: true },
              {
                label: t('accounting.printfulCosts'),
                value: chf(allTime.printfulCosts),
                red: true,
              },
              {
                label: t('accounting.grossProfit'),
                value: chf(allTime.grossProfit),
                green: allTime.grossProfit > 0,
              },
              { label: t('accounting.avgRevenuePerOrder'), value: chf(allTime.avgOrderRevenue) },
              {
                label: t('accounting.avgProfitPerOrder'),
                value: chf(allTime.avgOrderProfit),
                green: allTime.avgOrderProfit > 0,
              },
              {
                label: t('accounting.netProfit'),
                value: chf(allTime.netProfit),
                green: allTime.netProfit > 0,
                red2: allTime.netProfit < 0,
              },
            ].map(({ label, value, red, green, red2 }) => (
              <div key={label}>
                <p className="text-[11px] text-zinc-600">{label}</p>
                <p
                  className={`mt-1 text-sm sm:text-base font-bold ${red || red2 ? 'text-red-400' : green ? 'text-emerald-400' : 'text-zinc-200'}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          {allTime.activeMonths > 0 && (
            <p className="mt-4 text-[11px] text-zinc-600">
              {t('accounting.activeMonths', { n: allTime.activeMonths })}
            </p>
          )}
        </div>

        {/* Revenue Chart */}
        {monthly.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t('accounting.monthlyBreakdown')}
            </p>
            <AccountingCharts monthly={monthly} />
          </div>
        )}

        {/* Product Margins */}
        {products.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t('accounting.productMargins')}
            </p>
            <p className="mb-5 text-[11px] text-zinc-600">{t('accounting.productMarginsNote')}</p>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="pb-3 pr-2 w-6 hidden sm:table-cell">#</th>
                    <th className="pb-3 pr-3">{t('accounting.product')}</th>
                    <th className="pb-3 pr-3 text-right">{t('accounting.salePrice')}</th>
                    <th className="pb-3 pr-3 text-right hidden sm:table-cell">
                      {t('accounting.printfulCost')}
                    </th>
                    <th className="pb-3 pr-3 text-right hidden sm:table-cell">
                      {t('accounting.margin')}
                    </th>
                    <th className="pb-3 pr-3 text-right">{t('accounting.marginPct')}</th>
                    <th className="pb-3 pr-3 text-right hidden sm:table-cell">
                      {t('accounting.unitsSold')}
                    </th>
                    <th className="pb-3 text-right">{t('accounting.totalProfit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {products.map((p, idx) => (
                    <tr key={`${p.productId}-${p.variantName}`} className="text-zinc-300">
                      <td className="py-3 pr-2 text-[11px] text-zinc-600 font-mono hidden sm:table-cell">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-zinc-100 text-[12px] sm:text-sm leading-snug">
                          {p.productName}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-zinc-600">{p.variantName}</p>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-[12px] sm:text-sm text-zinc-200">
                        {chf(p.salePriceCents)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-red-400/80 hidden sm:table-cell">
                        {p.printfulCostCents > 0 ? chf(p.printfulCostCents) : '—'}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono hidden sm:table-cell">
                        <span className={marginColor(p.marginPercent)}>{chf(p.marginCents)}</span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold ${
                              p.marginPercent >= 50
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : p.marginPercent >= 30
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {p.marginPercent}%
                          </span>
                          <div className="w-10 sm:w-12 h-1 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.marginPercent >= 50
                                  ? 'bg-emerald-500'
                                  : p.marginPercent >= 30
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, p.marginPercent))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right text-zinc-400 hidden sm:table-cell">
                        {p.unitsSold}
                      </td>
                      <td
                        className={`py-3 text-right font-mono text-[12px] sm:text-sm font-bold ${profitColor(p.totalProfit)}`}
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t('accounting.fixedMonthlyCosts')}
            </p>
            <p className="mb-5 text-[11px] text-zinc-600">{t('accounting.recurringExpenses')}</p>
            <div className="space-y-2.5">
              {FIXED_COSTS.map((cost) => (
                <div key={cost.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[13px] sm:text-sm text-zinc-300">{cost.name}</span>
                    <span className="ml-2 text-[10px] sm:text-[11px] text-zinc-600 hidden sm:inline">
                      {cost.note}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[13px] sm:text-sm font-medium ${cost.amount > 0 ? 'text-red-400' : 'text-zinc-600'}`}
                  >
                    {cost.amount > 0 ? chf(cost.amount) : 'Free'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
              <span className="text-sm font-bold text-zinc-200">
                {t('accounting.totalPerMonth')}
              </span>
              <span className="font-mono text-base font-bold text-red-400">
                {chf(TOTAL_FIXED_MONTHLY)}
              </span>
            </div>
            {costCoverage.ordersNeeded > 0 && (
              <p className="mt-3 text-[11px] text-zinc-600">
                {t('accounting.breakEven', {
                  n: costCoverage.ordersNeeded,
                  avg: chf(costCoverage.avgProfitPerOrder),
                })}
              </p>
            )}
          </div>

          {/* Projection */}
          {bestProduct && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {t('accounting.projection')}
              </p>
              <p className="mb-5 text-[11px] text-zinc-600">
                {t('accounting.projectionNote', {
                  n: projectionUnits,
                  product: bestProduct.productName,
                })}
              </p>
              <div className="space-y-3">
                {[
                  {
                    label: t('accounting.grossRevenue'),
                    value: chf(projectionRevenue),
                    color: 'text-zinc-200',
                  },
                  {
                    label: t('accounting.printfulCosts'),
                    value: `- ${chf(projectionCost)}`,
                    color: 'text-red-400',
                  },
                  {
                    label: t('accounting.stripeFees'),
                    value: `- ${chf(projectionStripeFees)}`,
                    color: 'text-red-400',
                  },
                  {
                    label: t('accounting.fixedCostsPerMonth'),
                    value: `- ${chf(TOTAL_FIXED_MONTHLY)}`,
                    color: 'text-orange-400',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] sm:text-sm text-zinc-400 min-w-0">{label}</span>
                    <span
                      className={`font-mono text-[12px] sm:text-sm font-medium shrink-0 ${color}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
                  <span className="text-[13px] sm:text-sm font-bold text-zinc-200">
                    {t('accounting.netProfit')}
                  </span>
                  <span
                    className={`font-mono text-base sm:text-lg font-bold ${profitColor(projectionGrossProfit - TOTAL_FIXED_MONTHLY)}`}
                  >
                    {chf(projectionGrossProfit - TOTAL_FIXED_MONTHLY)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cash Flow Timeline */}
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-400 mb-3">
                {t('accounting.cashFlowTimeline')}
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start gap-3 sm:gap-2 text-[12px] text-zinc-400">
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
                  <div key={step} className="flex sm:flex-col items-center gap-2 sm:gap-1">
                    <div className="flex sm:flex-col items-center gap-2 sm:gap-1">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                        {step}
                      </div>
                      <div className="sm:text-center">
                        <p className="text-[11px] font-medium text-zinc-300">{label}</p>
                        <p className="text-[10px] text-zinc-600">{sub}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-zinc-700 shrink-0 rotate-90 sm:rotate-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-zinc-600">{t('accounting.cashFlowNote')}</p>
            </div>
          </div>
        </div>

        {/* Order-by-Order Breakdown */}
        {orders.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t('accounting.orderBreakdown')}
            </p>
            <p className="mb-5 text-[11px] text-zinc-600">{t('accounting.orderBreakdownNote')}</p>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="pb-3 pr-3">{t('accounting.date')}</th>
                    <th className="pb-3 pr-3">{t('accounting.customer')}</th>
                    <th className="pb-3 pr-3 text-right">{t('accounting.revenue')}</th>
                    <th className="pb-3 pr-3 text-right hidden sm:table-cell">
                      {t('accounting.stripeFee')}
                    </th>
                    <th className="pb-3 pr-3 text-right hidden sm:table-cell">
                      {t('accounting.printfulCosts')}
                    </th>
                    <th className="pb-3 text-right">{t('accounting.grossProfit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-zinc-300">
                      <td className="py-3 pr-3 text-zinc-500">
                        {/* Short date on mobile, full date on desktop */}
                        <span className="sm:hidden text-[11px]">
                          {new Date(order.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="hidden sm:inline text-[12px]">
                          {new Date(order.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="max-w-[100px] sm:max-w-[180px] truncate text-[12px] sm:text-sm text-zinc-300">
                          {order.customer}
                        </div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-[10px] text-zinc-600 hover:text-amber-400 transition-colors font-mono"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-[12px] sm:text-sm text-zinc-200">
                        {chf(order.revenueCents)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-red-400/80 hidden sm:table-cell">
                        -{chf(order.stripeFee)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-red-400/80 hidden sm:table-cell">
                        {order.printfulCostCents > 0 ? `-${chf(order.printfulCostCents)}` : '—'}
                      </td>
                      <td
                        className={`py-3 text-right font-mono text-[12px] sm:text-sm font-bold ${profitColor(order.grossProfit)}`}
                      >
                        {chf(order.grossProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 font-bold text-zinc-200">
                    <td
                      className="pt-4 pr-3 text-[11px] uppercase tracking-wider text-zinc-600"
                      colSpan={2}
                    >
                      Total
                    </td>
                    <td className="pt-4 pr-3 text-right font-mono text-[12px] sm:text-sm">
                      {chf(allTime.revenue)}
                    </td>
                    <td className="pt-4 pr-3 text-right font-mono text-red-400 hidden sm:table-cell">
                      -{chf(allTime.stripeFees)}
                    </td>
                    <td className="pt-4 pr-3 text-right font-mono text-red-400 hidden sm:table-cell">
                      -{chf(allTime.printfulCosts)}
                    </td>
                    <td
                      className={`pt-4 text-right font-mono text-sm sm:text-lg ${profitColor(allTime.grossProfit)}`}
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">{t('accounting.noOrders')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
