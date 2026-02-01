'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStock } from '@/actions/admin-products'
import { colorToHex } from '@/lib/color-swatch'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

type Variant = {
  id: string
  sku: string | null
  name: string | null
  price_cents: number
  attributes: Record<string, unknown>
  product_inventory: { quantity: number }[]
}

type Props = {
  variants: Variant[]
  onRefresh?: () => void
}

function getSize(v: Variant): string {
  const fromAttrs = v.attributes?.size as string | undefined
  const fromName = v.name?.match(/\([^)]*\s*\/\s*([^)]+)\)$/)?.[1]?.trim()
  return (fromAttrs || fromName) ?? '-'
}

export function ProductDetailAdmin({ variants, onRefresh }: Props) {
  const router = useRouter()
  const colors = Array.from(
    new Set(variants.map((v) => (v.attributes?.color as string) || 'Default'))
  ).sort((a, b) => (a === 'Default' ? 1 : a.localeCompare(b)))
  const defaultColor = colors[0] ?? 'Default'
  const [selectedColor, setSelectedColor] = useState(defaultColor)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [editQuantity, setEditQuantity] = useState(0)
  const [loading, setLoading] = useState(false)

  const variantsForColor = variants.filter((v) => ((v.attributes?.color as string) || 'Default') === selectedColor)
  const priceRange =
    variants.length === 0
      ? null
      : (() => {
          const prices = variants.map((v) => v.price_cents)
          const min = Math.min(...prices)
          const max = Math.max(...prices)
          return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
        })()

  async function handleUpdateStock(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVariant) return
    setLoading(true)
    const result = await updateStock(selectedVariant.id, editQuantity)
    setLoading(false)
    if (result.ok) {
      router.refresh()
      onRefresh?.()
    }
  }

  function selectVariant(variant: Variant) {
    setSelectedVariant(variant)
    setEditQuantity(variant.product_inventory?.[0]?.quantity ?? 0)
  }

  return (
    <div className="space-y-6">
      {priceRange && (
        <div>
          <span className="text-sm font-medium text-zinc-400">Price</span>
          <p className="mt-1 text-zinc-50">{priceRange}</p>
        </div>
      )}

      <div>
        <span className="text-sm font-medium text-zinc-400">Colors</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map((color) => {
            const hex = colorToHex(color)
            const isLight = ['#ffffff', '#fff', '#ffc0cb', '#fffdd0', '#f5f5dc'].includes(hex.toLowerCase())
            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                title={color}
                className={`h-8 w-8 shrink-0 rounded border-2 transition ${
                  selectedColor === color ? 'border-amber-500 ring-2 ring-amber-500/30' : isLight ? 'border-zinc-500' : 'border-zinc-600 hover:border-zinc-500'
                }`}
                style={{ backgroundColor: hex }}
              />
            )
          })}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-zinc-400">Sizes</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {variantsForColor.map((v) => {
            const size = getSize(v)
            const isSelected = selectedVariant?.id === v.id
            const qty = v.product_inventory?.[0]?.quantity ?? 0
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => selectVariant(v)}
                title={`${size} – ${formatPrice(v.price_cents)} · Stock: ${qty}`}
                className={`flex min-w-[3rem] items-center justify-center rounded border px-4 py-2 text-sm font-medium transition ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700'
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>

        {selectedVariant && (
          <form
            onSubmit={handleUpdateStock}
            className="mt-4 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
          >
            <label className="text-sm font-medium text-zinc-400">
              Stock for {getSize(selectedVariant)}
            </label>
            <input
              type="number"
              min={0}
              value={editQuantity}
              onChange={(e) => setEditQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-24 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Update'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
