'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
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
  const t = useTranslations('admin')
  // Internal color state removed - controlled by parent

  // Determine which variant is selected (store ID only to handle refreshes)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Derive the full variant object from props (so it updates on refresh)
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const [editQuantity, setEditQuantity] = useState(0)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [showAllVariants, setShowAllVariants] = useState(false)
  const [bulkQty, setBulkQty] = useState(0)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Pricing state
  const minPriceCents = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
  const initialCompareAt = variants[0]?.compare_at_price_cents ?? 0

  const [globalPrice, setGlobalPrice] = useState(minPriceCents / 100)
  const [promoPrice, setPromoPrice] = useState(initialCompareAt ? initialCompareAt / 100 : 0)
  const [savedPrice, setSavedPrice] = useState(minPriceCents)
  const [savedPromo, setSavedPromo] = useState(initialCompareAt)

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

  // Unsaved pricing changes warning
  const priceIsDirty =
    Math.round(globalPrice * 100) !== savedPrice || Math.round(promoPrice * 100) !== savedPromo
  useEffect(() => {
    if (!priceIsDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [priceIsDirty])

  async function handleUpdateStock(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVariant) return
    setLoading(true)
    const result = await updateStock(selectedVariant.id, editQuantity)
    setLoading(false)
    if (result.ok) {
      toast.success(t('stock.saved'))
      router.refresh()
      onRefresh?.()
    } else {
      toast.error(result.error || t('stock.saveFailed'))
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
      toast.success(t('pricing.saved'))
      setSavedPrice(Math.round(globalPrice * 100))
      setSavedPromo(Math.round(promoPrice * 100))
      router.refresh()
      onRefresh?.()
    } else {
      toast.error(result.error || t('pricing.saveFailed'))
    }
  }

  function selectVariant(variant: Variant) {
    setSelectedVariantId(variant.id)
  }

  async function handleBulkStock(e: React.FormEvent) {
    e.preventDefault()
    setBulkLoading(true)
    await Promise.all(variantsForColor.map((v) => updateStock(v.id, bulkQty)))
    setBulkLoading(false)
    toast.success(t('stock.bulkSaved'))
    router.refresh()
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
              <span className="font-semibold text-zinc-300">{totalVariants}</span>{' '}
              {t('stock.variants', { count: totalVariants })}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-300">{totalStock}</span> {t('stock.inStock')}
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
                  {t('stock.outOfStock', { count: oosVariants })}
                </span>
              </>
            )}
          </div>
        )}
        <form onSubmit={handleUpdatePrice} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t('pricing.finalPrice')}
              </label>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                {t('pricing.finalPriceDesc')}
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
                {t('pricing.promoPrice')}
              </label>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                {t('pricing.promoPriceDesc')}
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
              <span className="text-[10px] uppercase font-bold text-zinc-600">
                {t('pricing.preview')}
              </span>
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
            <div className="flex flex-col items-end gap-1">
              {priceIsDirty && (
                <span className="text-[10px] text-amber-400">{t('pricing.unsavedChanges')}</span>
              )}
              <button
                type="submit"
                disabled={priceLoading}
                className="rounded-lg bg-zinc-50 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {priceLoading ? t('pricing.updatingPrices') : t('pricing.saveAllPrices')}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box: MSRP */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            {t('pricing.msrpTitle')}
          </span>
          <p className="mt-1 text-base font-semibold text-zinc-400">{adviceRange ?? '—'}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">{t('pricing.msrpDesc')}</p>
        </div>
      </div>

      {/* Sizes Section */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <label
          htmlFor="variant-select"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
          {t('stock.sizeVariant', { color: selectedColor })}
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
              {t('stock.selectSize')}
            </option>
            {variantsForColor.map((v) => {
              const size = getSize(v)
              const qty = getQuantity(v)
              const isOutOfStock = qty === 0
              return (
                <option key={v.id} value={v.id}>
                  {size} — {formatPrice(v.price_cents)}{' '}
                  {isOutOfStock
                    ? t('stock.outOfStockLabel')
                    : t('stock.inStockLabel', { count: qty })}
                </option>
              )
            })}
          </select>
        </div>

        {/* Bulk stock set */}
        {variantsForColor.length > 0 && (
          <form onSubmit={handleBulkStock} className="mt-3 flex items-center gap-2">
            <label className="text-[10px] text-zinc-600 shrink-0">{t('stock.setAll')}</label>
            <input
              type="number"
              min={0}
              value={bulkQty}
              onChange={(e) => setBulkQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-center text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={bulkLoading}
              className="rounded bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {bulkLoading ? '…' : t('stock.setAllApply')}
            </button>
          </form>
        )}

        {/* Stock Update Form */}
        {selectedVariant && (
          <form
            onSubmit={handleUpdateStock}
            className="mt-6 space-y-4 rounded-lg border-2 border-amber-500/30 bg-amber-950/20 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">{t('stock.updateStock')}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {t('stock.sizeLabel')} {getSize(selectedVariant)} ·{' '}
                  {formatPrice(selectedVariant.price_cents)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="stock-input" className="sr-only">
                  {t('stock.stockQuantity')}
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
                    {t('stock.saving')}
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
                    {t('stock.update')}
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
              {t('stock.stockOverview', { color: selectedColor })}
            </p>
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80">
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      {t('stock.size')}
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      {t('stock.sku')}
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-500">
                      {t('stock.title')}
                    </th>
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
            <p className="mt-1.5 text-[10px] text-zinc-600">{t('stock.clickToSelect')}</p>
          </div>
        )}

        {/* All variants overview */}
        {variants.length > 0 && (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setShowAllVariants((prev) => !prev)}
              className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 hover:text-zinc-400 transition flex items-center gap-1"
            >
              {showAllVariants ? t('stock.hideAllColors') : t('stock.showAllColors')}
              <svg
                className={`h-3 w-3 transition-transform ${showAllVariants ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAllVariants && (
              <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">
                        {t('stock.color')}
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">
                        {t('stock.size')}
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">
                        {t('stock.sku')}
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-500">
                        {t('stock.title')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortVariantsBySize(variants).map((v) => {
                      const qty = getQuantity(v)
                      const isOos = qty === 0
                      const color = (v.attributes?.color as string) || 'Default'
                      return (
                        <tr
                          key={v.id}
                          onClick={() => {
                            onColorChange(color)
                            selectVariant(v)
                          }}
                          className="cursor-pointer border-b border-zinc-800/50 transition-colors last:border-0 hover:bg-zinc-800/60"
                        >
                          <td className="px-3 py-2 text-zinc-400">{color}</td>
                          <td className="px-3 py-2 font-medium text-zinc-200">{getSize(v)}</td>
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
