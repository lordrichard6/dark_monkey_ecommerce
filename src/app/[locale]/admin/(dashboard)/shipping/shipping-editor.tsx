'use client'

import { useState } from 'react'
import { updateShippingZone, updateFreeShippingThreshold } from '@/actions/admin-shipping'
import type { ShippingZoneRow } from '@/actions/admin-shipping'
import { toast } from 'sonner'

type Props = {
  zones: ShippingZoneRow[]
  threshold: number
}

function centsToChf(cents: number) {
  return (cents / 100).toFixed(2)
}

function chfToCents(val: string) {
  return Math.round(parseFloat(val) * 100)
}

export function ShippingEditor({ zones: initialZones, threshold: initialThreshold }: Props) {
  const [zones, setZones] = useState(initialZones)
  const [threshold, setThreshold] = useState(centsToChf(initialThreshold))
  const [saving, setSaving] = useState<string | null>(null)

  async function saveZone(zone: ShippingZoneRow, firstVal: string, additionalVal: string) {
    setSaving(zone.id)
    const firstCents = chfToCents(firstVal)
    const additionalCents = chfToCents(additionalVal)
    const result = await updateShippingZone(zone.id, firstCents, additionalCents)
    if (result.ok) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === zone.id
            ? { ...z, first_item_cents: firstCents, additional_item_cents: additionalCents }
            : z
        )
      )
      toast.success(`${zone.name} rates updated`)
    } else {
      toast.error(result.error ?? 'Failed to save')
    }
    setSaving(null)
  }

  async function saveThreshold() {
    setSaving('threshold')
    const cents = chfToCents(threshold)
    const result = await updateFreeShippingThreshold(cents)
    if (result.ok) {
      toast.success('Free shipping threshold updated')
    } else {
      toast.error(result.error ?? 'Failed to save')
    }
    setSaving(null)
  }

  return (
    <div className="space-y-8">
      {/* Zones */}
      <div className="space-y-4">
        {zones.map((zone) => (
          <ZoneRow key={zone.id} zone={zone} isSaving={saving === zone.id} onSave={saveZone} />
        ))}
      </div>

      {/* Free shipping threshold */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">Free Shipping Threshold</h3>
        <p className="mb-4 text-xs text-zinc-500">
          Orders above this amount get free shipping. Set to 0 to disable free shipping.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              CHF
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-11 pr-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            onClick={saveThreshold}
            disabled={saving === 'threshold'}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {saving === 'threshold' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ZoneRow({
  zone,
  isSaving,
  onSave,
}: {
  zone: ShippingZoneRow
  isSaving: boolean
  onSave: (zone: ShippingZoneRow, first: string, additional: string) => void
}) {
  const [first, setFirst] = useState(centsToChf(zone.first_item_cents))
  const [additional, setAdditional] = useState(centsToChf(zone.additional_item_cents))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">{zone.name}</h3>
          <p className="text-xs text-zinc-500">{zone.countries.join(', ')}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">First item (CHF)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              CHF
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-11 pr-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Each additional item (CHF)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              CHF
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={additional}
              onChange={(e) => setAdditional(e.target.value)}
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-11 pr-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => onSave(zone, first, additional)}
          disabled={isSaving}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
