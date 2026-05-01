'use client'

import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartData = {
  date: string
  revenue: number
  orders: number
}

interface StatsChartsProps {
  data: ChartData[]
  revenueTitle: string
  ordersTitle: string
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

// Short format for Y-axis ticks so they don't overflow on narrow screens
function formatPriceCompact(cents: number) {
  const chf = cents / 100
  if (chf >= 1000) return `${(chf / 1000).toFixed(1)}k`
  return String(Math.round(chf))
}

export function StatsCharts({ data, revenueTitle, ordersTitle }: StatsChartsProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Show ~5 date ticks across 30 data points regardless of screen width
  const xAxisInterval = Math.ceil(data.length / 5) - 1

  return (
    <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
      {/* Revenue chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-zinc-50 sm:text-base">{revenueTitle}</h3>
        <div className="mt-4 h-48 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: isMobile ? 0 : 8, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={xAxisInterval}
                tickFormatter={(str) => {
                  const date = new Date(str)
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis
                hide={isMobile}
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(value) => formatPriceCompact(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  color: '#fafafa',
                  fontSize: 13,
                }}
                itemStyle={{ color: '#10b981' }}
                formatter={(value) => [
                  formatPrice(typeof value === 'number' ? value : 0),
                  'Revenue',
                ]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-zinc-50 sm:text-base">{ordersTitle}</h3>
        <div className="mt-4 h-48 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: isMobile ? 0 : 8, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={xAxisInterval}
                tickFormatter={(str) => {
                  const date = new Date(str)
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis
                hide={isMobile}
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  color: '#fafafa',
                  fontSize: 13,
                }}
                itemStyle={{ color: '#f59e0b' }}
                formatter={(value) => [typeof value === 'number' ? value : 0, 'Orders']}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#f59e0b"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorOrders)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
