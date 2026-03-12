'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import {
  AddToCartForm,
  ProductQuantitySelector,
  ProductActionButtons,
  Variant,
  getSizeOrder,
} from './add-to-cart-form'
import { SizeGuideModal } from '@/components/product/SizeGuideModal'
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
import { trackProductView, trackAddToCart } from '@/lib/analytics'
import { useCurrency } from '@/components/currency/CurrencyContext'
import type { CustomizationRuleDef } from '@/types/customization'
import { ProductRatingSummary } from '@/components/product/ProductRatingSummary'
import { TrustBadges } from '@/components/product/TrustBadges'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/actions/cart'
import { colorToHex } from '@/lib/color-swatch'
import { CustomizationPanel } from '@/components/customization/CustomizationPanel'
import { StockNotificationButton } from '@/components/product/StockNotificationButton'
import { ProductInfoTabs } from '@/components/product/ProductInfoTabs'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

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
    material_info?: string | null
    care_instructions?: string | null
    print_method?: string | null
    size_guide_url?: string | null
    origin_country?: string | null
    avg_fulfillment_time?: string | null
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
  shipmentInfo?: string | null
  gpsrInfo?: string | null
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
  shipmentInfo,
  gpsrInfo,
}: Props) {
  const t = useTranslations('product')
  const { format, currency } = useCurrency()
  const router = useRouter()
  const addToCartFormRef = useRef<HTMLDivElement>(null)

  // ── Single source of truth for all selection state ──────────────────────
  // BUG FIX: Previously, ProductMain and AddToCartForm each had their own
  // selectedColor, selectedVariantId, quantity, config — causing mobile
  // Add to Cart to use stale/empty config and wrong variant.

  // Derive initial color directly (no empty-string initialisation) to fix price flicker
  const initialColor =
    variants.length > 0 ? (variants[0].attributes?.color as string) || 'Default' : 'Default'

  const [selectedColor, setSelectedColor] = useState<string>(initialColor)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  // BUG FIX: config is now owned here and passed down so mobile Add to Cart picks it up
  const [config, setConfig] = useState<Record<string, string>>({})

  const variantsForColor = variants.filter(
    (v) => (v.attributes?.color || 'Default') === selectedColor
  )

  const hasSizes = variantsForColor.some(
    (v) => v.attributes?.size || (v.name && v.name !== selectedColor)
  )
  const sizedVariants = [...variantsForColor].sort((a, b) => {
    const sizeA = (a.attributes?.size as string) || a.name || ''
    const sizeB = (b.attributes?.size as string) || b.name || ''
    return getSizeOrder(sizeA) - getSizeOrder(sizeB)
  })

  // Auto-select best variant when color changes
  useEffect(() => {
    const matched = variantsForColor.find((v) => v.id === selectedVariantId)
    if (!matched) {
      const best =
        variantsForColor.find((v) => (v.stock || 0) > 0)?.id || variantsForColor[0]?.id || null
      setSelectedVariantId(best)
    }
  }, [selectedColor, variantsForColor, selectedVariantId])

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const priceCents = selectedVariant?.price_cents ?? 0
  const stock = selectedVariant?.stock ?? 0

  // Color options — derived, never causes double-render flicker
  const colorItems: ColorOption[] = variants
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

  // For OOS color indicator — a color is fully OOS if ALL its variants have stock=0
  const colorStockMap = new Map<string, boolean>()
  for (const c of colorItems) {
    const colorVariants = variants.filter((v) => (v.attributes?.color || 'Default') === c.name)
    colorStockMap.set(
      c.name,
      colorVariants.some((v) => (v.stock ?? 0) > 0)
    )
  }

  // Track product view once on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Unified cart handler ─────────────────────────────────────────────────
  // BUG FIX: Single handleAddToCart used by both mobile and desktop.
  // BUG FIX: Returns boolean so handleBuyNow can check success before navigating.
  const handleAddToCart = async (): Promise<boolean> => {
    if (!selectedVariant) return false
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
        config, // BUG FIX: config was silently dropped on mobile previously
      })
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: priceCents,
        currency,
        quantity,
        category: product.categories?.name ?? undefined,
        variant: selectedVariant.name ?? undefined,
      })
      toast.success(t('addedToCart'), {
        description: `${product.name}${selectedVariant.name ? ` — ${selectedVariant.name}` : ''}`,
      })
      return true
    } catch (err) {
      toast.error(t('addToCartError') || 'Failed to add to cart. Please try again.')
      return false
    } finally {
      setIsAdding(false)
    }
  }

  // BUG FIX: only navigate to checkout if addToCart actually succeeded
  const handleBuyNow = async () => {
    const success = await handleAddToCart()
    if (success) router.push('/checkout')
  }

  // Stable reference — prevents AddToCartForm's onVariantChange useEffect from firing
  // on every ProductMain re-render and overwriting the mobile size selection.
  const handleVariantChange = useCallback((v: Variant | null) => {
    setSelectedVariantId(v?.id ?? null)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-0 md:py-8 md:px-8">
      {/* ── TOP SECTION ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 mt-4">
        {/* LEFT: Image System */}
        <div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:gap-8">
          {/* Main image — mobile only (no thumbnails, left cell of 2-col grid) */}
          <div className="md:hidden">
            <ProductImageGallery
              images={images}
              productName={product.name}
              selectedColor={selectedColor}
              selectedVariantId={selectedVariantId}
              showThumbnails={false}
            />
          </div>

          {/* Mobile info — right cell */}
          <div className="flex flex-col gap-3 md:hidden">
            {/* Name + category */}
            <div className="space-y-1">
              <h1 className="text-lg font-black leading-tight text-white">{product.name}</h1>
              {product.categories?.name && (
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  {product.categories.name}
                </p>
              )}
            </div>

            <ProductRatingSummary reviews={reviews} />

            {/* Price + stock — aria-live so screen readers announce updates */}
            <div className="flex flex-col gap-0.5 mt-1" aria-live="polite" aria-atomic="true">
              <span className="text-xl font-black text-amber-500">{format(priceCents)}</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${
                  stock > 0 ? 'text-green-500/90' : 'text-zinc-500'
                }`}
              >
                {stock > 0
                  ? stock <= 5
                    ? `${t('onlyLeft', { count: stock })}`
                    : t('inStock')
                  : t('outOfStock')}
              </span>
            </div>
          </div>

          {/* Desktop thumbnails gallery */}
          <div className="hidden md:block">
            <ProductImageGallery
              images={images}
              productName={product.name}
              selectedColor={selectedColor}
              selectedVariantId={selectedVariantId}
            />
          </div>
        </div>

        {/* RIGHT: Desktop info + form */}
        <div className="hidden md:flex flex-col gap-6">
          {/* Name + category + wishlist/share row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-white">{product.name}</h1>
              {product.categories?.name && (
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
                  {product.categories.name}
                </p>
              )}
            </div>
            {/* Wishlist + Share — only rendered on desktop here */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              <WishlistButton
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                productPrice={priceCents}
                productCurrency={currency}
                isInWishlist={isInWishlist}
                variant="icon"
              />
              <ShareButton
                productName={product.name}
                productUrl={`/products/${product.slug}`}
                productImage={images[0]?.url}
              />
            </div>
          </div>

          <ProductRatingSummary reviews={reviews} />

          {/* Price + stock — aria-live for screen readers */}
          <div aria-live="polite" aria-atomic="true">
            <AddToCartForm
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              variants={variants}
              images={images}
              primaryImageUrl={primaryImageUrl}
              onColorChange={setSelectedColor}
              onVariantChange={handleVariantChange}
              onConfigChange={setConfig}
              onQuantityChange={setQuantity}
              selectedColor={selectedColor}
              customizationRule={customizationRule}
              productCategory={product.categories?.name}
              sizeGuideUrl={product.size_guide_url}
              externalIsAdding={isAdding}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE MIDDLE: Color + Size + Quantity ───────────────── */}
      <div ref={addToCartFormRef} className="mt-6 md:hidden">
        {/* Colors — full width, large tap targets */}
        {colorItems.length > 1 && (
          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {t('color')}
              </span>
              {selectedColor && (
                <span className="text-[10px] font-semibold text-zinc-300">{selectedColor}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {colorItems.map((c) => {
                const hasStock = colorStockMap.get(c.name) ?? false
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={`${c.name}${!hasStock ? ' (out of stock)' : ''}`}
                    aria-pressed={selectedColor === c.name}
                    className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                      selectedColor === c.name
                        ? 'border-amber-500 ring-4 ring-amber-500/20 scale-110 shadow-lg shadow-amber-500/10'
                        : 'border-white/10 hover:border-white/30'
                    } ${!hasStock ? 'opacity-40' : ''}`}
                    style={{
                      background: c.hex2
                        ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)`
                        : c.hex,
                    }}
                  >
                    {!hasStock && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="absolute h-px w-[110%] rotate-45 bg-zinc-400/60" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mobile size selector */}
        {hasSizes && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {t('size')}
              </span>
              <SizeGuideModal
                productCategory={product.categories?.name}
                sizeGuideUrl={product.size_guide_url}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {sizedVariants.map((v) => {
                const sizeLabel = (v.attributes?.size as string) || v.name || '—'
                const isSelected = v.id === selectedVariantId
                const outOfStock = v.stock === 0
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={outOfStock}
                    aria-pressed={isSelected}
                    aria-label={`Size ${sizeLabel}${outOfStock ? ' (out of stock)' : ''}`}
                    className={`relative h-11 min-w-[3rem] px-4 rounded-lg border text-sm font-bold transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : outOfStock
                          ? 'border-white/5 text-zinc-600 cursor-not-allowed'
                          : 'border-white/10 text-zinc-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {sizeLabel}
                    {outOfStock && (
                      <span
                        className="absolute inset-0 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <span className="absolute left-1/2 top-1/2 h-px w-[80%] -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] bg-zinc-600" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {stock > 0 && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {t('quantity')}
            </span>
            <ProductQuantitySelector quantity={quantity} setQuantity={setQuantity} stock={stock} />
          </div>
        )}

        {/* Mobile customization panel */}
        {customizationRule && (
          <div className="mb-4">
            <CustomizationPanel ruleDef={customizationRule} config={config} onChange={setConfig} />
          </div>
        )}

        {/* Mobile action buttons OR out-of-stock notification */}
        {stock === 0 ? (
          <StockNotificationButton
            productId={product.id}
            variantId={selectedVariantId || ''}
            productName={product.name}
            variantName={selectedVariant?.name || null}
          />
        ) : (
          <ProductActionButtons
            isAdding={isAdding}
            stock={stock}
            onSubmit={handleAddToCart}
            onBuyNow={handleBuyNow}
            disabled={!selectedVariantId}
          />
        )}

        {/* Mobile wishlist + share — below action buttons */}
        <div className="flex items-center gap-3 mt-4">
          <WishlistButton
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            productPrice={priceCents}
            productCurrency={currency}
            isInWishlist={isInWishlist}
            variant="button"
            className="flex-1 justify-center"
          />
          <ShareButton
            productName={product.name}
            productUrl={`/products/${product.slug}`}
            productImage={images[0]?.url}
          />
        </div>
      </div>

      {/* ── TRUST BADGES ────────────────────────────────────────── */}
      <div className="mt-10 mb-16">
        <TrustBadges />
      </div>

      {/* ── DESCRIPTION ─────────────────────────────────────────── */}
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

      {/* ── INFO TABS (Material / Care & Print / Shipment / GPSR) ── */}
      <div className="mt-10 max-w-4xl">
        <ProductInfoTabs
          materialInfo={product.material_info ?? null}
          careInstructions={product.care_instructions ?? null}
          printMethod={product.print_method ?? null}
          originCountry={product.origin_country ?? null}
          avgFulfillmentTime={product.avg_fulfillment_time ?? null}
          shipmentInfo={shipmentInfo ?? null}
          gpsrInfo={gpsrInfo ?? null}
        />
      </div>

      {/* ── REVIEWS ─────────────────────────────────────────────── */}
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

      {/* ── STORY + SOCIAL PROOF ────────────────────────────────── */}
      <div className="mt-12">
        <ProductStory story={storyContent || null} />
        <LivePurchaseIndicator productId={product.id} />
      </div>

      <RecentPurchaseToast productId={product.id} />

      {/* Sticky bar receives quantity so it adds the correct amount */}
      <StickyAddToCart
        productName={product.name}
        priceCents={priceCents}
        imageUrl={images[0]?.url || ''}
        stock={stock}
        quantity={quantity}
        onAddToCart={handleAddToCart}
        observeRef={addToCartFormRef}
      />
    </div>
  )
}
