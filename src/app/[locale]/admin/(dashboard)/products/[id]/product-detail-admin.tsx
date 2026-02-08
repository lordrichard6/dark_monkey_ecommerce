'use client'

import { useState, useEffect } from 'react'
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
  product_inventory: any
}

function getQuantity(v: any): number {
  const inv = v.product_inventory
  if (!inv) return 0
  if (Array.isArray(inv)) return inv[0]?.quantity ?? 0
  return inv.quantity ?? 0
}

type Props = {
  variants: Variant[]
  onRefresh?: () => void
  selectedColor: string
  onColorChange: (color: string) => void
  availableColors: string[]
}

function getSize(v: Variant): string {
  const fromAttrs = v.attributes?.size as string | undefined
  const fromName = v.name?.match(/\([^)]*\s*\/\s*([^)]+)\)$/)?.[1]?.trim()
  return (fromAttrs || fromName) ?? '-'
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

function sortVariantsBySize(variants: Variant[]): Variant[] {
  return [...variants].sort((a, b) => {
    const sizeA = getSize(a)
    const sizeB = getSize(b)
    const indexA = SIZE_ORDER.indexOf(sizeA)
    const indexB = SIZE_ORDER.indexOf(sizeB)

    // If both are found in the predefined order, compare their indices
    if (indexA !== -1 && indexB !== -1) return indexA - indexB

    // If only one is found, prioritize it
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    // Fallback to alphabetical for unknown sizes
    return sizeA.localeCompare(sizeB)
  })
}

export function ProductDetailAdmin({ variants = [], onRefresh, selectedColor, onColorChange, availableColors = [] }: Props) {
  const router = useRouter()
  // Internal color state removed - controlled by parent

  // Determine which variant is selected (store ID only to handle refreshes)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Derive the full variant object from props (so it updates on refresh)
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const [editQuantity, setEditQuantity] = useState(0)
  const [loading, setLoading] = useState(false)

  const variantsForColor = sortVariantsBySize(
    variants.filter((v) => ((v.attributes?.color as string) || 'Default') === selectedColor)
  )
  const priceRange =
    variants.length === 0
      ? null
      : (() => {
        const prices = variants.map((v) => v.price_cents)
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
      })()

  // Sync editQuantity when selectedVariant changes (including after refresh)
  useEffect(() => {
    if (selectedVariant) {
      setEditQuantity(getQuantity(selectedVariant))
    }
  }, [selectedVariant])

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
    setSelectedVariantId(variant.id)
  }

  return (
    <div className="space-y-6">
      {/* Price Range */}
      {priceRange && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Price Range</span>
          <p className="mt-1.5 text-xl font-semibold text-zinc-50">{priceRange}</p>
        </div>
      )}

      {/* Colors Section */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Colors</span>
        <div className="mt-3 flex flex-wrap gap-3">
          {availableColors.map((color) => {
            const hex = colorToHex(color)
            const isLight = ['#ffffff', '#fff', '#ffc0cb', '#fffdd0', '#f5f5dc'].includes(hex.toLowerCase())
            const isSelected = selectedColor === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                title={color}
                className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${isSelected
                  ? 'border-amber-500 ring-4 ring-amber-500/20 scale-110'
                  : isLight
                    ? 'border-zinc-600 hover:border-zinc-500 hover:scale-105'
                    : 'border-zinc-700 hover:border-zinc-600 hover:scale-105'
                  }`}
              >
                <div
                  className="h-full w-full rounded-md"
                  style={{ backgroundColor: hex }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sizes Section */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <label htmlFor="variant-select" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Size / Variant for {selectedColor}
        </label>

        <div className="mt-3">
          <select
            id="variant-select"
            value={selectedVariantId ?? ''}
            onChange={(e) => {
              const v = variantsForColor.find((v) => v.id === e.target.value)
              if (v) selectVariant(v)
            }}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="" disabled>Select a size...</option>
            {variantsForColor.map((v) => {
              const size = getSize(v)
              const qty = getQuantity(v)
              const isOutOfStock = qty === 0
              return (
                <option key={v.id} value={v.id}>
                  {size} — {formatPrice(v.price_cents)} {isOutOfStock ? '(Out of Stock)' : `(${qty} in stock)`}
                </option>
              )
            })}
          </select>
        </div>

        {/* Stock Update Form */}
        {selectedVariant && (
          <form
            onSubmit={handleUpdateStock}
            className="mt-6 space-y-4 rounded-lg border-2 border-amber-500/30 bg-amber-950/20 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">Update Stock</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Size: {getSize(selectedVariant)} · {formatPrice(selectedVariant.price_cents)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="stock-input" className="sr-only">Stock quantity</label>
                <input
                  id="stock-input"
                  type="number"
                  min={0}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-center text-lg font-semibold text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="0"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Update
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
