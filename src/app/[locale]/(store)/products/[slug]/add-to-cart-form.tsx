'use client'

import { useState, useMemo } from 'react'
import { addToCart } from '@/actions/cart'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CustomizationPanel } from '@/components/customization/CustomizationPanel'
import { CustomizationPreview } from '@/components/customization/CustomizationPreview'
import { ShippingCountdown } from '@/components/product/ShippingCountdown'
import { getPriceModifierFromConfig } from '@/types/customization'
import type { CustomizationRuleDef } from '@/types/customization'
import { colorToHex } from '@/lib/color-swatch'
import { ColorOption } from '@/types/product'
import { useCurrency } from '@/components/currency/CurrencyContext'

type Variant = {
  id: string
  name: string | null
  price_cents: number
  attributes: Record<string, string>
  stock: number
}

function getSize(v: Variant): string {
  const fromAttrs = v.attributes?.size as string | undefined
  const fromName = v.name?.match(/\([^)]*\s*\/\s*([^)]+)\)$/)?.[1]?.trim()
  return (fromAttrs || fromName) ?? '-'
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase())
    const ib = SIZE_ORDER.indexOf(b.toUpperCase())
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}


type AddToCartFormProps = {
  productId: string
  productSlug: string
  productName: string
  variants: Variant[]
  primaryImageUrl?: string
  customizationRule?: CustomizationRuleDef | null
  productCategory?: string
  // Controlled props
  selectedColor?: string
  onColorChange?: (color: string) => void
  availableColors?: ColorOption[]
  images?: Array<{ url: string; color?: string | null; sort_order: number }>
}


function inferProductType(category: string | undefined): 'mug' | 'hat' | 'hoodie' {
  if (!category) return 'mug'
  const c = category.toLowerCase()
  if (c.includes('cup') || c.includes('mug') || c.includes('tumbler')) return 'mug'
  if (c.includes('hat') || c.includes('cap')) return 'hat'
  return 'hoodie'
}

export function AddToCartForm({
  productId,
  productSlug,
  productName,
  variants,
  primaryImageUrl,
  customizationRule,
  productCategory,
  ...props
}: AddToCartFormProps) {
  const t = useTranslations('product')
  const { format } = useCurrency()
  const router = useRouter()

  // Internal fallback if not controlled (though we aim to control it)
  const colors = useMemo<ColorOption[]>(
    () => {
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
      return Array.from(colorMap.values()).sort((a, b) =>
        a.name === 'Default' ? 1 : a.name.localeCompare(b.name)
      )
    },
    [variants]
  )
  const firstColor = colors[0]?.name ?? 'Default'

  // Use prop if available, else internal state
  const isControlled = props.selectedColor !== undefined
  const [internalColor, setInternalColor] = useState(firstColor)
  const selectedColor = isControlled ? props.selectedColor! : internalColor

  // Update available colors usage
  const displayColors = props.availableColors ?? colors

  const variantsForFirstColor = useMemo(
    () =>
      variants.filter(
        (v) => ((v.attributes?.color as string) || 'Default') === selectedColor
      ),
    [variants, selectedColor]
  )

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variantsForFirstColor.find((v) => v.stock > 0)?.id ?? variantsForFirstColor[0]?.id ?? variants[0]?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})

  const variantsForColor = useMemo(
    () =>
      variants.filter(
        (v) => ((v.attributes?.color as string) || 'Default') === selectedColor
      ),
    [variants, selectedColor]
  )

  const allSizes = useMemo(
    () =>
      sortSizes(
        Array.from(new Set(variants.map((v) => getSize(v)).filter((s) => s && s !== '-')))
      ),
    [variants]
  )

  const variantByColorAndSize = useMemo(() => {
    const map = new Map<string, Variant>()
    for (const v of variants) {
      const color = (v.attributes?.color as string) || 'Default'
      const size = getSize(v)
      map.set(`${color}:${size}`, v)
    }
    return map
  }, [variants])

  function handleColorChange(color: string) {
    if (isControlled) {
      props.onColorChange?.(color)
    } else {
      setInternalColor(color)
    }

    // Also update selected variant to first available in new color
    const forColor = (variants || []).filter(
      (v) => ((v.attributes?.color as string) || 'Default') === color
    )
    const next = forColor.find((v) => (v.stock ?? 0) > 0) ?? forColor[0]
    setSelectedVariantId(next?.id ?? null)
  }

  const selectedVariant = (variants || []).find((v) => v.id === selectedVariantId)
  const basePriceCents = selectedVariant?.price_cents ?? 0
  const modifierCents = customizationRule
    ? getPriceModifierFromConfig(customizationRule, config as Record<string, unknown>)
    : 0
  const priceCents = basePriceCents + modifierCents
  const stock = selectedVariant?.stock ?? 0
  const canAdd = selectedVariantId && stock > 0 && quantity > 0

  const configForCart =
    customizationRule && Object.keys(config).some((k) => config[k]?.trim())
      ? (Object.fromEntries(
        Object.entries(config).filter(([, v]) => v != null && String(v).trim())
      ) as Record<string, unknown>)
      : undefined

  async function handleAddToCart(e: React.FormEvent) {
    e.preventDefault()
    if (!canAdd || !selectedVariant) return
    setIsAdding(true)
    const colorImage = (props.images || []).find(img => img.color === selectedColor)
    const cartImageUrl = colorImage?.url || primaryImageUrl

    try {
      await addToCart({
        variantId: selectedVariant.id,
        productId,
        productSlug,
        productName,
        variantName: selectedVariant.name,
        priceCents,
        quantity,
        imageUrl: cartImageUrl,
        config: configForCart,
      })
      router.refresh()
    } finally {
      setIsAdding(false)
    }
  }

  if (variants.length === 0) return null

  const productType = inferProductType(productCategory)

  return (
    <form onSubmit={handleAddToCart} className="mt-8 space-y-6">
      {customizationRule && (
        <>
          {primaryImageUrl && (
            <div className="mb-4">
              <CustomizationPreview
                imageUrl={primaryImageUrl}
                config={config}
                productType={productType}
              />
            </div>
          )}
          <CustomizationPanel
            ruleDef={customizationRule}
            config={config}
            onChange={setConfig}
          />
        </>
      )}

      {/* Color (circular swatches, one default selected) */}
      {displayColors.length > 1 && (
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {t('color')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {selectedColor}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {displayColors.map((colorObj) => {
              const isObject = typeof colorObj === 'object' && colorObj !== null
              const name = isObject ? (colorObj as ColorOption).name : String(colorObj)
              const hex = (isObject ? (colorObj as ColorOption).hex : null) || colorToHex(name)
              const hex2 = isObject ? (colorObj as ColorOption).hex2 : undefined
              const isSelected = selectedColor === name

              const background = hex2
                ? `linear-gradient(135deg, ${hex} 50%, ${hex2} 50%)`
                : hex

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleColorChange(name)}
                  title={name}
                  className={`relative h-7 w-7 shrink-0 rounded-full border transition-all duration-500 ${isSelected
                    ? 'border-white ring-[3px] ring-white/10 ring-offset-2 ring-offset-zinc-950 scale-110 z-10'
                    : 'border-white/10 hover:border-white/40 hover:scale-110'
                    }`}
                  style={{ background }}
                >
                  <span className="sr-only">{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Size Dropdown */}
      {allSizes.length >= 1 && (
        <div className="space-y-2">
          <label htmlFor="variant-select" className="block text-sm font-medium text-zinc-400">
            Size
          </label>
          <div className="relative">
            <select
              id="variant-select"
              value={selectedVariantId ?? ''}
              onChange={(e) => {
                const v = variantsForColor.find(v => v.id === e.target.value)
                // Or if user selects a size that doesn't exist for this color (shouldn't happen with filtering), handle it
                // Actually the dropdown should list available variants for *selected color* OR all sizes if we want to mimic the button behavior which was showing all sizes and disabling some.
                // The admin dropdown showed specific variants for the color.
                // Here, `allSizes` was computed from ALL variants.
                // But `variantByColorAndSize` helps lookup.
                // Let's list ALL sizes as options, but disable ones not available in this color.
                // OR better: Just list the variants available for this color like in Admin.
                // However, the previous UI showed all sizes. 
                // If I switch to Admin style:
                if (v) setSelectedVariantId(v.id)
              }}
              className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 pr-10 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
            >
              {allSizes.map((size) => {
                const variant = variantByColorAndSize.get(`${selectedColor}:${size}`)
                const exists = !!variant
                const outOfStock = variant ? variant.stock === 0 : true
                const disabled = !exists || outOfStock

                // If not exists, maybe don't show? Or show as unavailable.
                // For consistency with Admin, let's show all but mark them.
                // Actually, Admin only showed variants for that color.
                // Let's try to mimic Admin: Filter to variants for this color?
                // But `allSizes` is used to maintain order.

                return (
                  <option key={size} value={variant?.id ?? ''} disabled={disabled}>
                    {size} {exists ? `— ${format(variant!.price_cents)}` : ''} {disabled ? (exists ? '(Out of Stock)' : '(Unavailable)') : `(${variant!.stock} in stock)`}
                  </option>
                )
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {selectedVariant && (
            <p className="mt-1.5 text-sm text-zinc-500">
              {stock > 0 && stock <= 5 ? (
                <span className="font-medium text-amber-400">{t('onlyXLeft', { count: stock })}</span>
              ) : (
                <>{stock} {t('inStock')}</>
              )}
            </p>
          )}
        </div>
      )}

      {/* Price and Estimated delivery side-by-side on big devices */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-sm font-medium text-zinc-400">{t('priceLabel')}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">
            {format(priceCents)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">{t('inclVat')}</p>
          {modifierCents > 0 && (
            <p className="mt-1 text-sm text-amber-400/80">{t('includesCustomization')}</p>
          )}
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-sm font-medium text-zinc-400">{t('estimatedDelivery')}</p>
          <p className="mt-1.5 flex items-center gap-2 text-zinc-50">
            <span className="inline-flex h-5 w-6 shrink-0 items-center justify-center rounded-sm bg-[#ff0000] text-[10px] font-bold text-white" title="Switzerland">
              CH
            </span>
            Switzerland
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-zinc-50">
            {t('deliveryDays')}
            <button
              type="button"
              title="Delivery estimate may vary"
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-medium text-zinc-300 hover:bg-zinc-500"
            >
              i
            </button>
          </p>
          <p className="mt-1 text-sm text-zinc-500">{t('shippingStartsAt')}</p>
          <ShippingCountdown />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="quantity" className="sr-only">
            {t('quantity')}
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={stock}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(stock, parseInt(e.target.value, 10) || 1)))}
            className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
          />
        </div>
        <button
          type="submit"
          disabled={!canAdd || isAdding}
          className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? t('adding') : t('addToCart')}
        </button>
      </div>
    </form>
  )
}
