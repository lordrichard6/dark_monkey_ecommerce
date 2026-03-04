'use client'

import dynamic from 'next/dynamic'

// Lazy-load the heavy Recharts bundle only when this client component mounts.
// Using a dedicated client wrapper because `ssr: false` is only valid inside Client Components.
const StatsChartsLazy = dynamic(
  () => import('@/components/admin/StatsCharts').then((m) => m.StatsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8 h-64 rounded-lg border border-zinc-800 bg-zinc-900/40 animate-pulse" />
    ),
  }
)

type ChartDataPoint = {
  date: string
  revenue: number
  orders: number
}

export function StatsChartsClient({ data }: { data: ChartDataPoint[] }) {
  return <StatsChartsLazy data={data} />
}
