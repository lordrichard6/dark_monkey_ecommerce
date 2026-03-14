'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProductImageManager } from './product-image-manager'
import { ProductDetailAdmin } from './product-detail-admin'
import { ColorOption } from '@/types/product'
import { generateMockupsForProduct } from '@/actions/generate-mockups'
import { syncPrintfulProductById } from '@/actions/sync-printful'
import { Tooltip } from '@/components/admin/Tooltip'

type Props = {
  productId: string
  printfulSyncProductId: number | null
  images: Array<{
    id: string
    url: string
    alt: string | null
    sort_order?: number
    color?: string | null
  }>
  variants: Array<{
    id: string
    sku: string | null
    name: string | null
    price_cents: number
    compare_at_price_cents: number | null
    attributes: Record<string, unknown>
    product_inventory: { quantity: number } | { quantity: number }[] | null
  }>
  /** Slot rendered at the top of the right column (name, slug, category, tags, status) */
  metaSlot?: React.ReactNode
  /** Slot rendered below the two columns (description) */
  descriptionSlot?: React.ReactNode
}

export function ProductEditor({
  productId,
  printfulSyncProductId,
  images,
  variants,
  metaSlot,
  descriptionSlot,
}: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [resyncing, setResyncing] = useState(false)
  const [resyncResult, setResyncResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Derive available colors with their hex codes
  const colorMap = new Map<string, ColorOption>()
  variants.forEach((v) => {
    const name = (v.attributes?.color as string) || 'Default'
    if (!colorMap.has(name)) {
      colorMap.set(name, {
        name,
        hex: v.attributes?.color_code as string,
        hex2: v.attributes?.color_code2 as string,
      })
    }
  })
  const colors = Array.from(colorMap.values()).sort((a, b) =>
    a.name === 'Default' ? 1 : a.name.localeCompare(b.name)
  )

  const defaultColor = colors[0]?.name ?? 'Default'
  const [selectedColor, setSelectedColor] = useState(defaultColor)

  // Auto-dismiss generate result feedback after 4s
  useEffect(() => {
    if (!generateResult) return
    const t = setTimeout(() => setGenerateResult(null), 4000)
    return () => clearTimeout(t)
  }, [generateResult])

  useEffect(() => {
    if (!resyncResult) return
    const t = setTimeout(() => setResyncResult(null), 4000)
    return () => clearTimeout(t)
  }, [resyncResult])

  async function handleResync() {
    if (!printfulSyncProductId) return
    setResyncing(true)
    setResyncResult(null)
    try {
      const result = await syncPrintfulProductById(printfulSyncProductId)
      if (result.ok) {
        setResyncResult({ success: true, message: t('printful.resyncSuccess') })
        router.refresh()
      } else {
        setResyncResult({ success: false, message: result.error ?? t('printful.resyncFailed') })
      }
    } catch (err) {
      setResyncResult({ success: false, message: String(err) })
    } finally {
      setResyncing(false)
    }
  }

  async function handleGenerateMockups() {
    if (!printfulSyncProductId) return
    setGenerating(true)
    setGenerateResult(null)
    try {
      const result = await generateMockupsForProduct(printfulSyncProductId)
      if (result.success) {
        setGenerateResult({
          success: true,
          message: `Generated ${result.count} mockup${result.count !== 1 ? 's' : ''} successfully`,
        })
        router.refresh()
      } else {
        setGenerateResult({
          success: false,
          message: result.error ?? result.message ?? t('printful.generationFailed'),
        })
      }
    } catch (err) {
      setGenerateResult({ success: false, message: String(err) })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — Images card (sticky) */}
        <div className="order-2 lg:order-1">
          <div className="sticky top-4 z-30 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t('products.productImages')}
              </h3>

              {/* Printful action buttons — only shown for Printful-linked products */}
              {printfulSyncProductId && (
                <div className="flex items-center gap-2">
                  <Tooltip content={t('printful.resyncTooltip')} align="right" width={240}>
                    <button
                      type="button"
                      onClick={handleResync}
                      disabled={resyncing}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-blue-500/50 hover:bg-blue-950/20 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resyncing ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              opacity="0.25"
                            />
                            <path
                              d="M12 2a10 10 0 0 1 10 10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          {t('printful.syncing')}
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {t('printful.resyncPrintful')}
                        </>
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip content={t('printful.generateTooltip')} align="right" width={240}>
                    <button
                      type="button"
                      onClick={handleGenerateMockups}
                      disabled={generating}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-amber-500/50 hover:bg-amber-950/20 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              opacity="0.25"
                            />
                            <path
                              d="M12 2a10 10 0 0 1 10 10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          {t('printful.generating')}
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {t('printful.generateMockups')}
                        </>
                      )}
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Resync result feedback */}
            {resyncResult && (
              <div
                className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                  resyncResult.success
                    ? 'bg-emerald-900/30 text-emerald-400'
                    : 'bg-red-900/30 text-red-400'
                }`}
              >
                {resyncResult.message}
              </div>
            )}

            {/* Generate result feedback */}
            {generateResult && (
              <div
                className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                  generateResult.success
                    ? 'bg-emerald-900/30 text-emerald-400'
                    : 'bg-red-900/30 text-red-400'
                }`}
              >
                {generateResult.message}
              </div>
            )}

            <ProductImageManager
              productId={productId}
              images={images}
              selectedColor={selectedColor}
              availableColors={colors.map((c) => c.name)}
            />
          </div>
        </div>

        {/* RIGHT — Meta + Pricing/Stock */}
        <div className="order-1 space-y-6 lg:order-2">
          {/* Product identity card (name, slug, category, tags, status) */}
          {metaSlot && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">{metaSlot}</div>
          )}

          {/* Pricing / colors / stock */}
          <ProductDetailAdmin
            productId={productId}
            variants={variants}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            availableColors={colors}
          />
        </div>
      </div>

      {/* Description — full width below the grid */}
      {descriptionSlot && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          {descriptionSlot}
        </div>
      )}
    </div>
  )
}
