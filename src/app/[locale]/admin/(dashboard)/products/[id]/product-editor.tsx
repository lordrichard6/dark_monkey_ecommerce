'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProductImageManager } from './product-image-manager'
import { ProductDetailAdmin } from './product-detail-admin'
import { ColorOption } from '@/types/product'
import { generateMockupsForProduct } from '@/actions/generate-mockups'

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
    product_inventory: unknown
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
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<{
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
          message: result.error ?? result.message ?? 'Generation failed',
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
                Product Images
              </h3>

              {/* Generate Mockups Button — only shown for Printful-linked products */}
              {printfulSyncProductId && (
                <button
                  type="button"
                  onClick={handleGenerateMockups}
                  disabled={generating}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-amber-500/50 hover:bg-amber-950/20 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Generate mockups from Printful design files"
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
                      Generating…
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
                      Generate Mockups
                    </>
                  )}
                </button>
              )}
            </div>

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
