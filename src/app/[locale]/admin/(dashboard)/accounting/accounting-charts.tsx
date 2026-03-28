'use client'

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
import type { MonthlyData } from '@/actions/accounting'

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`
}

interface Props {
  monthly: MonthlyData[]
}

export function AccountingCharts({ monthly }: Props) {
  const data = monthly.map((m) => ({
    month: m.month,
    Revenue: m.revenue,
    'Stripe Fees': m.stripeFees,
    'Printful Costs': m.printfulCosts,
    'Gross Profit': m.grossProfit,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `CHF ${(v / 100).toFixed(0)}`}
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
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
        <Bar dataKey="Revenue" fill="#3f3f46" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Printful Costs" fill="#7c3aed" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Stripe Fees" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="Gross Profit"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: '#f59e0b', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
