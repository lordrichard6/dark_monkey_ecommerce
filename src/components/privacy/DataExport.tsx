'use client'

import { useState } from 'react'
import {
  Download,
  Loader2,
  FileJson,
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  Heart,
  Star,
  Zap,
  Bell,
} from 'lucide-react'
import { exportUserData } from '@/actions/gdpr'
import type { ExportSummary } from '@/actions/gdpr'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

type Format = 'json' | 'csv'

type Props = {
  lastExportAt?: string | null
}

function buildCsv(data: Record<string, unknown>): string {
  const lines: string[] = []

  // Orders
  lines.push('=== ORDERS ===')
  lines.push('ID,Status,Total (cents),Currency,Created At')
  const orders =
    (data.orders as {
      id: string
      status: string
      total_cents: number
      currency: string
      created_at: string
    }[]) ?? []
  for (const o of orders) {
    lines.push(`${o.id},${o.status},${o.total_cents},${o.currency},${o.created_at}`)
  }

  lines.push('')
  lines.push('=== ADDRESSES ===')
  lines.push('Type,Full Name,Line 1,City,Postal Code,Country,Default')
  const addresses =
    (data.addresses as {
      type: string
      full_name: string
      line1: string
      city: string
      postal_code: string
      country: string
      is_default: boolean
    }[]) ?? []
  for (const a of addresses) {
    lines.push(
      `${a.type},"${a.full_name}","${a.line1}",${a.city},${a.postal_code},${a.country},${a.is_default}`
    )
  }

  lines.push('')
  lines.push('=== WISHLIST ===')
  lines.push('Product ID,Added At')
  const wishlist = (data.wishlist as { product_id: string; created_at: string }[]) ?? []
  for (const w of wishlist) {
    lines.push(`${w.product_id},${w.created_at}`)
  }

  lines.push('')
  lines.push('=== REVIEWS ===')
  lines.push('Product ID,Rating,Created At')
  const reviews =
    (data.reviews as { product_id: string; rating: number; created_at: string }[]) ?? []
  for (const r of reviews) {
    lines.push(`${r.product_id},${r.rating},${r.created_at}`)
  }

  return lines.join('\n')
}

const SUMMARY_ITEMS = [
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'wishlistItems', label: 'Wishlist items', icon: Heart },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'xpEvents', label: 'XP events', icon: Zap },
  { key: 'pushSubscriptions', label: 'Push subscriptions', icon: Bell },
] as const

export function DataExport({ lastExportAt }: Props) {
  const t = useTranslations('gdpr')
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<Format>('json')
  const [summary, setSummary] = useState<ExportSummary | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const result = await exportUserData()
      if (!result.success || !result.data) {
        toast.error(result.error ?? t('exportError'))
        return
      }

      setSummary(result.summary ?? null)
      setShowSummary(true)

      const date = new Date().toISOString().split('T')[0]

      if (format === 'csv') {
        const csv = buildCsv(result.data)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `darkmonkey-data-export-${date}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `darkmonkey-data-export-${date}.json`
        a.click()
        URL.revokeObjectURL(url)
      }

      toast.success(t('exportSuccess'))
    } catch {
      toast.error(t('exportError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-white/[0.03] p-6 backdrop-blur-sm">
      <h3 className="mb-1 text-lg font-semibold text-zinc-50">{t('exportTitle')}</h3>
      <p className="mb-4 text-sm text-zinc-400">{t('exportDescription')}</p>

      {/* Last export date */}
      {lastExportAt && (
        <p className="mb-4 text-xs text-zinc-600">
          Last exported:{' '}
          <span className="text-zinc-500" suppressHydrationWarning>
            {new Date(lastExportAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </p>
      )}

      {/* Format selector */}
      <div className="mb-4 flex gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="export-format"
            value="json"
            checked={format === 'json'}
            onChange={() => setFormat('json')}
            className="h-4 w-4 border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
          />
          <span className="flex items-center gap-1.5 text-sm text-zinc-300">
            <FileJson className="h-4 w-4 text-zinc-500" />
            JSON <span className="text-xs text-zinc-600">(full data)</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="export-format"
            value="csv"
            checked={format === 'csv'}
            onChange={() => setFormat('csv')}
            className="h-4 w-4 border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
          />
          <span className="flex items-center gap-1.5 text-sm text-zinc-300">
            <FileText className="h-4 w-4 text-zinc-500" />
            CSV <span className="text-xs text-zinc-600">(orders, addresses, wishlist)</span>
          </span>
        </label>
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {loading ? t('exportLoading') : t('exportButton')}
      </button>

      {/* Summary panel — shown after export */}
      {summary && (
        <div className="mt-4">
          <button
            onClick={() => setShowSummary((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {showSummary ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showSummary ? 'Hide' : 'Show'} export summary
          </button>
          {showSummary && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUMMARY_ITEMS.map(({ key, label, icon: Icon }) => {
                const count = summary[key as keyof ExportSummary] ?? 0
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{count}</p>
                      <p className="text-xs text-zinc-600">{label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
