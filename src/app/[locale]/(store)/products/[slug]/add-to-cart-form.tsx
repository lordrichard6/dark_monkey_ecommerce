'use client'

import { CreditCard, Plus, Minus } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { addToCart } from '@/actions/cart'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CustomizationPanel } from '@/components/customization/CustomizationPanel'
import { CustomizationPreview } from '@/components/customization/CustomizationPreview'
import { getPriceModifierFromConfig } from '@/types/customization'
import type { CustomizationRuleDef } from '@/types/customization'
import { colorToHex } from '@/lib/color-swatch'
import { ColorOption } from '@/types/product'
import { StockNotificationButton } from '@/components/product/StockNotificationButton'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { trackAddToCart, trackCustomization } from '@/lib/analytics'

export type Variant = {
  id: string
  name: string | null
  price_cents: number
  attributes: Record<string, string>
  stock: number
}

// --- SUB-COMPONENTS ---

export function ProductQuantitySelector({
  quantity,
  setQuantity,
  stock,
  className = '',
}: {
  quantity: number
  setQuantity: (q: number) => void
  stock: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-10 items-center rounded-xl border border-white/10 bg-zinc-900/50 p-1">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="flex h-full w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex w-8 justify-center font-bold text-zinc-100 text-sm">{quantity}</div>
        <button
          type="button"
          onClick={() => setQuantity(Math.min(stock, quantity + 1))}
          className="flex h-full w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ProductActionButtons({
  isAdding,
  stock,
  onSubmit,
  onBuyNow,
  disabled = false,
}: {
  isAdding: boolean
  stock: number
  onSubmit: () => void
  onBuyNow: () => void
  disabled?: boolean
}) {
  const t = useTranslations('product')
  if (stock === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button
        type="button"
        disabled={disabled || isAdding}
        onClick={onSubmit}
        className="h-12 flex items-center justify-center rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-blue-500 disabled:opacity-50"
      >
        {isAdding ? t('adding') : t('addToCart')}
      </button>
      <button
        type="button"
        onClick={onBuyNow}
        className="h-12 flex items-center justify-center rounded-xl bg-[#f97316] text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-orange-500"
      >
        {t('buyNow')}
      </button>
    </div>
  )
}

interface AddToCartFormProps {
  productId: string
  productSlug: string
  productName: string
  variants: Variant[]
  primaryImageUrl?: string
  customizationRule?: CustomizationRuleDef | null
  productCategory?: string
  selectedColor?: string
  onColorChange?: (color: string) => void
  onVariantChange?: (variant: Variant | null) => void
  availableColors?: ColorOption[]
  images?: Array<{
    url: string
    color?: string | null
    sort_order: number
    variant_id?: string | null
  }>
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
  const { format, currency } = useCurrency()
  const router = useRouter()

  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})

  const colors = useMemo(() => {
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
  }, [variants])

  const initialColor = props.selectedColor || colors[0]?.name || 'Default'
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  useEffect(() => {
    if (props.selectedColor) setSelectedColor(props.selectedColor)
  }, [props.selectedColor])

  const variantsForColor = useMemo(
    () => variants.filter((v) => (v.attributes?.color || 'Default') === selectedColor),
    [variants, selectedColor]
  )

  useEffect(() => {
    const matched = variantsForColor.find((v) => v.id === selectedVariantId)
    if (!matched) {
      const def = variantsForColor.find((v) => v.stock > 0)?.id || variantsForColor[0]?.id || null
      setSelectedVariantId(def)
    }
  }, [selectedColor, variantsForColor, selectedVariantId])

  const { onVariantChange } = props
  useEffect(() => {
    const v = variants.find((v) => v.id === selectedVariantId)
    onVariantChange?.(v ?? null)
  }, [selectedVariantId, variants, onVariantChange])

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const priceCents = selectedVariant?.price_cents || 0
  const stock = selectedVariant?.stock || 0
  const canAdd = !!selectedVariant && stock > 0

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    setIsAdding(true)
    const cartImageUrl =
      (props.images || []).find((img) => img.color === selectedColor)?.url || primaryImageUrl

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
        config,
      })
      trackAddToCart({
        id: productId,
        name: productName,
        price: priceCents,
        currency,
        quantity,
        category: productCategory,
        variant: selectedVariant.name || undefined,
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    router.push('/checkout')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Price & Stock info */}
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-black text-amber-500">{format(priceCents)}</span>
        {stock > 0 ? (
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
            {t('inStock')}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {t('outOfStock')}
          </span>
        )}
      </div>

      {/* Colors */}
      {colors.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setSelectedColor(c.name)
                props.onColorChange?.(c.name)
              }}
              className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === c.name ? 'border-amber-500 ring-4 ring-amber-500/10 scale-110 shadow-lg shadow-amber-500/10' : 'border-white/10 hover:border-white/30'}`}
              style={{ background: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      )}

      {/* Customization */}
      {customizationRule && (
        <CustomizationPanel ruleDef={customizationRule} config={config} onChange={setConfig} />
      )}

      {/* Action Row: Quantity & Buttons */}
      <div className="flex flex-col gap-4">
        {stock > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {t('quantity')}
            </span>
            <ProductQuantitySelector quantity={quantity} setQuantity={setQuantity} stock={stock} />
          </div>
        )}

        {stock === 0 ? (
          <StockNotificationButton
            productId={productId}
            variantId={selectedVariantId || ''}
            productName={productName}
            variantName={selectedVariant?.name || null}
          />
        ) : (
          <ProductActionButtons
            isAdding={isAdding}
            stock={stock}
            onSubmit={handleAddToCart}
            onBuyNow={handleBuyNow}
            disabled={!canAdd}
          />
        )}
      </div>
    </div>
  )
}
