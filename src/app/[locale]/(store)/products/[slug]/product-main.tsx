'use client'

import { useState, useEffect } from 'react'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import {
  AddToCartForm,
  ProductQuantitySelector,
  ProductActionButtons,
  Variant,
} from './add-to-cart-form'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ShareButton } from '@/components/product/ShareButton'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { ProductReviews } from '@/components/reviews/ProductReviews'
import type { ReviewRow } from '@/components/reviews/ProductReviews'
import { useTranslations } from 'next-intl'
import { ColorOption } from '@/types/product'
import { LivePurchaseIndicator } from '@/components/product/LivePurchaseIndicator'
import { RecentPurchaseToast } from '@/components/product/RecentPurchaseToast'
import { ProductStory } from '@/components/product/ProductStory'
import type { StoryContent } from '@/lib/story-content'
import { trackProductView } from '@/lib/analytics'
import { useCurrency } from '@/components/currency/CurrencyContext'
import type { CustomizationRuleDef } from '@/types/customization'
import { ProductRatingSummary } from '@/components/product/ProductRatingSummary'
import { TrustBadges } from '@/components/product/TrustBadges'
import { Breadcrumbs } from '@/components/product/Breadcrumbs'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/actions/cart'
import { colorToHex } from '@/lib/color-swatch'
import { CustomizationPanel } from '@/components/customization/CustomizationPanel'

type Props = {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    categories: { name?: string } | null
    images: Array<{
      url: string
      alt: string | null
      sort_order: number
      color?: string | null
      variant_id?: string | null
    }>
  }
  images: Array<{
    url: string
    alt: string | null
    sort_order: number
    color?: string | null
    variant_id?: string | null
  }>
  variants: Variant[]
  reviews: ReviewRow[]
  userReview: ReviewRow | null
  isBestseller: boolean
  isInWishlist: boolean
  canSubmitReview: boolean
  orderIdFromQuery?: string
  primaryImageUrl?: string
  customizationRule?: CustomizationRuleDef | null
  userId?: string
  storyContent?: StoryContent | null
}

export function ProductMain({
  product,
  images = [],
  variants = [],
  reviews = [],
  userReview,
  isBestseller,
  isInWishlist,
  canSubmitReview,
  orderIdFromQuery,
  primaryImageUrl,
  customizationRule,
  userId,
  storyContent,
}: Props) {
  const t = useTranslations('product')
  const { format, currency } = useCurrency()
  const router = useRouter()

  // Coordination state
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!selectedColor && variants && variants.length > 0) {
      setSelectedColor((variants[0].attributes?.color as string) || 'Default')
    }
  }, [variants])

  const variantsForColor = variants.filter(
    (v) => (v.attributes?.color || 'Default') === selectedColor
  )

  useEffect(() => {
    const matched = variantsForColor.find((v) => v.id === selectedVariantId)
    if (!matched && variantsForColor.length > 0) {
      const def =
        variantsForColor.find((v) => (v.stock || 0) > 0)?.id || variantsForColor[0]?.id || null
      setSelectedVariantId(def)
    }
  }, [selectedColor, variantsForColor])

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const priceCents = selectedVariant?.price_cents || 0
  const stock = selectedVariant?.stock || 0

  const colorItems = variants
    .reduce((acc: ColorOption[], v) => {
      const name = (v.attributes?.color as string) || 'Default'
      if (!acc.find((c) => c.name === name)) {
        acc.push({
          name,
          hex: (v.attributes?.color_code as string) || colorToHex(name),
          hex2: (v.attributes?.color_code2 as string) || undefined,
        })
      }
      return acc
    }, [])
    .sort((a, b) => (a.name === 'Default' ? 1 : a.name.localeCompare(b.name)))

  // Track product view on mount
  useEffect(() => {
    if (variants.length > 0) {
      const lowestPrice = Math.min(...variants.map((v) => v.price_cents))
      trackProductView({
        id: product.id,
        name: product.name,
        price: lowestPrice,
        currency,
        category: product.categories?.name,
      })
    }
  }, [product.id, product.name, variants, currency, product.categories])

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    setIsAdding(true)
    const cartImageUrl = images.find((img) => img.color === selectedColor)?.url || primaryImageUrl
    try {
      await addToCart({
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: selectedVariant.name,
        priceCents,
        quantity,
        imageUrl: cartImageUrl,
        config,
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
    <div className="max-w-7xl mx-auto px-4 py-0 md:py-8 md:px-8">
      {/* 1. Breadcrumbs Removed - handled by global layout as per screenshot */}

      {/* 2. Top Section: 2-column mobile split */}
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 mt-4">
        {/* LEFT: Image System */}
        <div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:gap-8">
          {/* Main Image (Left cell on mobile) */}
          <div>
            <ProductImageGallery
              images={images}
              productName={product.name}
              selectedColor={selectedColor}
              showThumbnails={false}
            />
          </div>

          {/* Mobile Info Split (Right cell on mobile) */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="space-y-1">
              <h1 className="text-lg font-black leading-tight text-white">{product.name}</h1>
              {product.categories?.name && (
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  {product.categories.name}
                </p>
              )}
            </div>

            <ProductRatingSummary reviews={reviews} />

            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-xl font-black text-amber-500">{format(priceCents)}</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${stock > 0 ? 'text-green-500/90' : 'text-zinc-500'}`}
              >
                {stock > 0 ? t('inStock') : t('outOfStock')}
              </span>
            </div>

            {/* Colors swatches for mobile split */}
            <div className="flex flex-col gap-1 mt-1">
              {colorItems.length > 1 && selectedColor && (
                <span className="text-[9px] font-semibold text-zinc-400">{selectedColor}</span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {colorItems.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={c.name}
                    aria-pressed={selectedColor === c.name}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${selectedColor === c.name ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-white/10'}`}
                    style={{
                      background: c.hex2
                        ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)`
                        : c.hex,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Thumbnails (Only on MD+) */}
          <div className="hidden md:block">
            <ProductImageGallery
              images={images}
              productName={product.name}
              selectedColor={selectedColor}
            />
          </div>
        </div>

        {/* RIGHT: Desktop Info Block */}
        <div className="hidden md:flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-white">{product.name}</h1>
            {product.categories?.name && (
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
                {product.categories.name}
              </p>
            )}
          </div>

          <ProductRatingSummary reviews={reviews} />

          <AddToCartForm
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            variants={variants}
            onColorChange={setSelectedColor}
            onVariantChange={(v) => setSelectedVariantId(v?.id || null)}
            selectedColor={selectedColor}
            customizationRule={customizationRule}
          />
        </div>
      </div>

      {/* 3. Middle Section: Mobile Thumbnails | Quantity split */}
      <div className="grid grid-cols-2 gap-4 mt-8 md:hidden items-center">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              className="h-10 w-10 shrink-0 rounded-lg border border-white/5 bg-zinc-900/50 overflow-hidden opacity-40"
            >
              <img src={img.url} alt="" className="h-full w-full object-cover grayscale" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <ProductQuantitySelector quantity={quantity} setQuantity={setQuantity} stock={stock} />
        </div>
      </div>

      {/* 4. Action Buttons for Mobile */}
      <div className="mt-8 md:hidden">
        <ProductActionButtons
          isAdding={isAdding}
          stock={stock}
          onSubmit={handleAddToCart}
          onBuyNow={handleBuyNow}
          disabled={!selectedVariantId}
        />
      </div>

      {/* 5. Trust Badges */}
      <div className="mt-10 mb-16">
        <TrustBadges />
      </div>

      {/* 6. Product Description Card */}
      <div className="max-w-4xl">
        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 flex items-center gap-4">
          {t('details')}
          <div className="h-px flex-1 bg-white/5" />
        </h2>
        <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 md:p-12">
          <div
            className="styled-description prose prose-invert prose-sm md:prose-base max-w-none text-zinc-400 font-sans leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description || '' }}
          />
        </div>
      </div>

      {/* 7. Footer Sections */}
      <div className="mt-24 border-t border-white/5 pt-20">
        <div id="reviews-section">
          <ProductReviews
            productId={product.id}
            productSlug={product.slug}
            reviews={reviews}
            userReview={userReview}
            canSubmit={canSubmitReview}
            userId={userId}
            orderIdFromQuery={orderIdFromQuery}
          />
        </div>
      </div>

      <div className="mt-12">
        <ProductStory story={storyContent || null} />
        <LivePurchaseIndicator productId={product.id} />
      </div>

      <RecentPurchaseToast productId={product.id} />
      <StickyAddToCart
        productName={product.name}
        priceCents={priceCents}
        imageUrl={images[0]?.url || ''}
        stock={stock}
      />
    </div>
  )
}
