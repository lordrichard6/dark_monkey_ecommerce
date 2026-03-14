'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateStock, updateProductPrice } from '@/actions/admin-products'
import { colorToHex } from '@/lib/color-swatch'
import { ColorOption } from '@/types/product'

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
  compare_at_price_cents: number | null
  attributes: Record<string, unknown>
  product_inventory: { quantity: number } | { quantity: number }[] | null
}

function getQuantity(v: {
  product_inventory: { quantity: number } | { quantity: number }[] | null
}): number {
  const inv = v.product_inventory
  if (!inv) return 0
  if (Array.isArray(inv)) return inv[0]?.quantity ?? 0
  return inv.quantity ?? 0
}

type Props = {
  productId: string
  variants: Variant[]
  onRefresh?: () => void
  selectedColor: string
  onColorChange: (color: string) => void
  availableColors: ColorOption[]
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

export function ProductDetailAdmin({
  productId,
  variants = [],
  onRefresh,
  selectedColor,
  onColorChange,
  availableColors = [],
}: Props) {
  const router = useRouter()
  // Internal color state removed - controlled by parent

  // Determine which variant is selected (store ID only to handle refreshes)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Derive the full variant object from props (so it updates on refresh)
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const [editQuantity, setEditQuantity] = useState(0)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)

  // Pricing state
  const minPriceCents = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
  const initialCompareAt = variants[0]?.compare_at_price_cents ?? 0

  const [globalPrice, setGlobalPrice] = useState(minPriceCents / 100)
  const [promoPrice, setPromoPrice] = useState(initialCompareAt ? initialCompareAt / 100 : 0)

  // Sync price state when props update (e.g. after router.refresh())
  const prevMinPriceCents = useRef(minPriceCents)
  const prevCompareAt = useRef(initialCompareAt)
  useEffect(() => {
    if (prevMinPriceCents.current !== minPriceCents) {
      setGlobalPrice(minPriceCents / 100)
      prevMinPriceCents.current = minPriceCents
    }
    if (prevCompareAt.current !== initialCompareAt) {
      setPromoPrice(initialCompareAt ? initialCompareAt / 100 : 0)
      prevCompareAt.current = initialCompareAt
    }
  }, [minPriceCents, initialCompareAt])

  const variantsForColor = sortVariantsBySize(
    variants.filter((v) => ((v.attributes?.color as string) || 'Default') === selectedColor)
  )
  const adviceRange =
    variants.length === 0
      ? null
      : (() => {
          const prices = variants.map((v) => (v.attributes?.rrp_cents as number) || v.price_cents)
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

  async function handleUpdatePrice(e: React.FormEvent) {
    e.preventDefault()
    setPriceLoading(true)
    const result = await updateProductPrice(
      productId,
      Math.round(globalPrice * 100),
      promoPrice > 0 ? Math.round(promoPrice * 100) : null
    )
    setPriceLoading(false)
    if (result.ok) {
      router.refresh()
      onRefresh?.()
    }
  }

  function selectVariant(variant: Variant) {
    setSelectedVariantId(variant.id)
  }

  // ── Inventory summary (all variants) ──────────────────────────────────────
  const totalVariants = variants.length
  const oosVariants = variants.filter((v) => getQuantity(v) === 0).length
  const totalStock = variants.reduce((sum, v) => sum + getQuantity(v), 0)

  return (
    <div className="space-y-6">
      {/* Price Management Section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        {/* Variant summary header */}
        {totalVariants > 0 && (
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-zinc-800">
            <span className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-300">{totalVariants}</span> variant
              {totalVariants !== 1 ? 's' : ''}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-300">{totalStock}</span> in stock
            </span>
            {oosVariants > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  {oosVariants} out of stock
                </span>
              </>
            )}
          </div>
        )}
        <form onSubmit={handleUpdatePrice} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Final Price (CHF)
              </label>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                The price customers pay at checkout. Applied to all sizes and colors.
              </p>
              <input
                type="number"
                step="0.01"
                value={globalPrice}
                onChange={(e) => setGlobalPrice(parseFloat(e.target.value) || 0)}
                className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg font-bold text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Promo Price (Strikethrough)
              </label>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                Optional. If set, this appears crossed out next to the Final Price in the store —
                showing customers the original value (e.g.{' '}
                <span className="line-through">CHF 45.00</span> → CHF 35.00).
              </p>
              <input
                type="number"
                step="0.01"
                value={promoPrice || ''}
                placeholder="e.g. 45.00"
                onChange={(e) => setPromoPrice(parseFloat(e.target.value) || 0)}
                className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg font-bold text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-zinc-800 pt-6">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-zinc-600">Preview</span>
              <div className="mt-1 flex items-baseline gap-2">
                {promoPrice > 0 && (
                  <span className="text-sm font-medium text-zinc-500 line-through">
                    {formatPrice(Math.round(promoPrice * 100))}
                  </span>
                )}
                <span className="text-2xl font-black text-amber-500">
                  {formatPrice(Math.round(globalPrice * 100))}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={priceLoading}
              className="rounded-lg bg-zinc-50 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {priceLoading ? 'Updating...' : 'Save All Prices'}
            </button>
          </div>
        </form>

        {/* Info Box: MSRP */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            Manufacturer&apos;s Suggested Retail Price (MSRP)
          </span>
          <p className="mt-1 text-base font-semibold text-zinc-400">{adviceRange ?? '—'}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
            This is the price range Printful recommends for this product based on production and
            fulfillment costs. It covers your base cost plus a reasonable margin. Use it as a
            reference — your Final Price above can be set higher or lower as you see fit.
          </p>
        </div>
      </div>

      {/* Colors Section */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Colors</span>
        <div className="mt-3 flex flex-wrap gap-3">
          {availableColors.map((colorObj) => {
            const colorName = colorObj.name
            const hex = colorObj.hex || colorToHex(colorName)
            const hex2 = colorObj.hex2
            const isLight = ['#ffffff', '#fff', '#ffc0cb', '#fffdd0', '#f5f5dc'].includes(
              hex.toLowerCase()
            )
            const isSelected = selectedColor === colorName

            const background = hex2 ? `linear-gradient(135deg, ${hex} 50%, ${hex2} 50%)` : hex

            return (
              <button
                key={colorName}
                type="button"
                onClick={() => onColorChange(colorName)}
                title={colorName}
                className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-amber-500 ring-4 ring-amber-500/20 scale-110'
                    : isLight
                      ? 'border-zinc-600 hover:border-zinc-500 hover:scale-105'
                      : 'border-zinc-700 hover:border-zinc-600 hover:scale-105'
                }`}
              >
                <div className="h-full w-full rounded-md" style={{ background }} />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
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
        <label
          htmlFor="variant-select"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
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
            <option value="" disabled>
              Select a size...
            </option>
            {variantsForColor.map((v) => {
              const size = getSize(v)
              const qty = getQuantity(v)
              const isOutOfStock = qty === 0
              return (
                <option key={v.id} value={v.id}>
                  {size} — {formatPrice(v.price_cents)}{' '}
                  {isOutOfStock ? '(Out of Stock)' : `(${qty} in stock)`}
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
                <label htmlFor="stock-input" className="sr-only">
                  Stock quantity
                </label>
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
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Update
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Stock Overview Table ─────────────────────────────────────── */}
        {variantsForColor.length > 0 && (
          <div className="mt-5 border-t border-zinc-800 pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Stock overview — {selectedColor}
            </p>
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80">
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Size</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">SKU</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-500">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {variantsForColor.map((v) => {
                    const qty = getQuantity(v)
                    const isOos = qty === 0
                    const isSelected = v.id === selectedVariantId
                    return (
                      <tr
                        key={v.id}
                        onClick={() => selectVariant(v)}
                        className={`cursor-pointer border-b border-zinc-800/50 transition-colors last:border-0 ${
                          isSelected ? 'bg-amber-500/10' : 'hover:bg-zinc-800/60'
                        }`}
                      >
                        <td
                          className={`px-3 py-2 font-medium ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}
                        >
                          {getSize(v)}
                        </td>
                        <td className="px-3 py-2 font-mono text-zinc-500">{v.sku ?? '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${
                              isOos
                                ? 'bg-red-950/40 text-red-400'
                                : qty <= 3
                                  ? 'bg-amber-950/40 text-amber-400'
                                  : 'bg-emerald-950/40 text-emerald-400'
                            }`}
                          >
                            {qty}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-600">
              Click a row to select that variant for editing.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
