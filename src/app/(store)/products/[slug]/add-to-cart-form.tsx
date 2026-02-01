'use client'

import { useState } from 'react'
import { addToCart } from '@/actions/cart'
import { useRouter } from 'next/navigation'
import { CustomizationPanel } from '@/components/customization/CustomizationPanel'
import { CustomizationPreview } from '@/components/customization/CustomizationPreview'
import { getPriceModifierFromConfig } from '@/types/customization'
import type { CustomizationRuleDef } from '@/types/customization'

type Variant = {
  id: string
  name: string | null
  price_cents: number
  attributes: Record<string, string>
  stock: number
}

type AddToCartFormProps = {
  productId: string
  productSlug: string
  productName: string
  variants: Variant[]
  primaryImageUrl?: string
  customizationRule?: CustomizationRuleDef | null
  productCategory?: string
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
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
}: AddToCartFormProps) {
  const router = useRouter()
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
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
    try {
      await addToCart({
        variantId: selectedVariant.id,
        productId,
        productSlug,
        productName,
        variantName: selectedVariant.name,
        priceCents,
        quantity,
        imageUrl: primaryImageUrl,
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

      {variants.length > 1 ? (
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Select variant
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                disabled={v.stock === 0}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  selectedVariantId === v.id
                    ? 'border-white bg-white text-zinc-950'
                    : v.stock === 0
                      ? 'cursor-not-allowed border-zinc-700 text-zinc-600'
                      : 'border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {v.name ?? formatPrice(v.price_cents)}
                {v.stock === 0 && ' (out of stock)'}
              </button>
            ))}
          </div>
        </div>
      ) : (
        selectedVariant && (
          <p className="text-zinc-400">
            {selectedVariant.name && `${selectedVariant.name} — `}
            {stock} in stock
          </p>
        )
      )}

      <div className="flex items-baseline gap-4">
        <span className="text-2xl font-bold text-zinc-50">
          {formatPrice(priceCents)}
        </span>
        {modifierCents > 0 && (
          <span className="text-sm text-amber-400/80">
            (includes customization)
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="quantity" className="sr-only">
            Quantity
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
          {isAdding ? 'Adding...' : 'Add to cart'}
        </button>
      </div>
    </form>
  )
}
