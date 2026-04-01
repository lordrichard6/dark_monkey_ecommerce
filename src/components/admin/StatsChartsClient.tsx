'use client'

import dynamic from 'next/dynamic'

// Lazy-load the heavy Recharts bundle only when this client component mounts.
// Using a dedicated client wrapper because `ssr: false` is only valid inside Client Components.
const StatsChartsLazy = dynamic(
  () => import('@/components/admin/StatsCharts').then((m) => m.StatsCharts),
  {
    ssr: false,
    // Skeleton mirrors the actual 2-column chart grid so layout doesn't shift on hydration
    loading: () => (
      <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
        <div className="h-[17rem] animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/40 sm:h-[21rem]" />
        <div className="h-[17rem] animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/40 sm:h-[21rem]" />
      </div>
    ),
  }
)

type ChartDataPoint = {
  date: string
  revenue: number
  orders: number
}

export function StatsChartsClient({
  data,
  revenueTitle,
  ordersTitle,
}: {
  data: ChartDataPoint[]
  revenueTitle: string
  ordersTitle: string
}) {
  return <StatsChartsLazy data={data} revenueTitle={revenueTitle} ordersTitle={ordersTitle} />
}
