'use client'

import { useState, useEffect } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyData } from '@/lib/accounting-utils'

function chf(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export interface AccountingChartsProps {
  monthly: MonthlyData[]
}

type Props = AccountingChartsProps

export function AccountingCharts({ monthly }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const data = monthly.map((m) => ({
    month: m.month,
    Revenue: m.revenue,
    'Stripe Fees': m.stripeFees,
    'Printful Costs': m.printfulCosts,
    'Gross Profit': m.grossProfit,
  }))

  return (
    <div className="mt-4 h-56 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 4, left: isMobile ? 0 : 8, bottom: isMobile ? 32 : 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#71717a', fontSize: isMobile ? 10 : 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
            interval={isMobile ? 1 : 0}
          />
          <YAxis
            hide={isMobile}
            tickFormatter={(v) => chf(v)}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            labelStyle={{ color: '#e4e4e7', fontSize: 12, fontWeight: 600 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number | undefined) => (value != null ? chf(value) : '')}
          />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{
              fontSize: isMobile ? 10 : 11,
              color: '#a1a1aa',
              paddingTop: isMobile ? 8 : 0,
            }}
          />
          <Bar dataKey="Revenue" fill="#3f3f46" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Printful Costs" fill="#7c3aed" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Stripe Fees" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
          <Line
            type="monotone"
            dataKey="Gross Profit"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: isMobile ? 2 : 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
