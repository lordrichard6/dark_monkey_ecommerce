'use client'

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
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 0,
    }).format(cents / 100)
}

export function StatsCharts({ data }: StatsChartsProps) {
    return (
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-base font-semibold text-zinc-50">Revenue (last 30 days)</h3>
                <div className="mt-6 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
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
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const date = new Date(str)
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                }}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatPrice(value)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    color: '#fafafa',
                                }}
                                itemStyle={{ color: '#10b981' }}
                                formatter={(value: number | undefined) => [formatPrice(value || 0), 'Revenue']}
                                labelFormatter={(label) => {
                                    return new Date(label).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-base font-semibold text-zinc-50">Orders (last 30 days)</h3>
                <div className="mt-6 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
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
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const date = new Date(str)
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                }}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    color: '#fafafa',
                                }}
                                itemStyle={{ color: '#f59e0b' }}
                                formatter={(value: number | undefined) => [value || 0, 'Orders']}
                                labelFormatter={(label) => {
                                    return new Date(label).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                stroke="#f59e0b"
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
