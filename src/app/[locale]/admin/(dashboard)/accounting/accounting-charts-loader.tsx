'use client'

import dynamic from 'next/dynamic'
import type { AccountingChartsProps } from './accounting-charts'

const AccountingCharts = dynamic(
  () => import('./accounting-charts').then((m) => m.AccountingCharts),
  { ssr: false }
)

export function AccountingChartsLoader(props: AccountingChartsProps) {
  return <AccountingCharts {...props} />
}
