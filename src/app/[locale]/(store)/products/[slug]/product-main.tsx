'use client'

import { useState, useEffect } from 'react'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import { AddToCartForm } from './add-to-cart-form'
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

type Props = {
    product: {
        id: string
        name: string
        slug: string
        description: string | null
        categories: { name?: string } | null
    }
    images: Array<{ url: string; alt: string | null; sort_order: number; color?: string | null; variant_id?: number }>
    variants: Array<any>
    reviews: ReviewRow[]
    userReview: ReviewRow | null
    isBestseller: boolean
    isInWishlist: boolean
    canSubmitReview: boolean
    orderIdFromQuery?: string
    primaryImageUrl?: string
    customizationRule?: any
    userId?: string
    storyContent?: StoryContent | null
}

export function ProductMain({
    product,
    images,
    variants,
    reviews,
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
    const tProduct = useTranslations('product')
    const { currency } = useCurrency()

    const lowestPrice = variants && variants.length > 0
        ? Math.min(...variants.map((v) => v.price_cents))
        : 0
    const totalStock = (variants || []).reduce((acc, v) => acc + (v.stock || 0), 0)

    // Track product view
    useEffect(() => {
        if (variants && variants.length > 0) {
            trackProductView({
                id: product.id,
                name: product.name,
                price: lowestPrice,
                currency: currency,
                category: product.categories?.name,
            })
        }
    }, [product.id, product.name, variants, currency, product.categories])

    // Derive available colors with their Printful hex codes
    const colorMap = new Map<string, ColorOption>()
        ; (variants || []).forEach((v) => {
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

    // Default to the color of the primary image if available, else first color
    const primaryImageColor = images.find(img => img.sort_order === 0 || img.url === primaryImageUrl)?.color
    const initialColor = (primaryImageColor && colorMap.has(primaryImageColor))
        ? primaryImageColor
        : (colors[0]?.name ?? 'Default')

    const [selectedColor, setSelectedColor] = useState(initialColor)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

    return (
        <div className="grid gap-12 md:grid-cols-2 items-start">
            {/* Left Column: Images (Sticky on desktop) */}
            <div className="md:sticky md:top-24">
                <ProductImageGallery
                    images={images}
                    productName={product.name}
                    selectedColor={selectedColor}
                    selectedVariantId={selectedVariantId}
                />
            </div>

            {/* Right Column: Details & Form */}
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-zinc-50 md:text-3xl">
                        {product.name}
                    </h1>
                    {isBestseller && (
                        <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                            {tProduct('bestseller')}
                        </span>
                    )}
                </div>

                {/* Live Purchase Indicator */}
                <div className="mt-3">
                    <LivePurchaseIndicator productId={product.id} />
                </div>
                {product.description && (
                    <div className="mt-6 space-y-4">
                        {/* Split by bullet points if they exist, otherwise treat as one block */}
                        {product.description.includes('•') ? (
                            <div className="space-y-4">
                                {product.description.split('•').map((item, i) => {
                                    const trimmed = item.trim();
                                    if (!trimmed) return null;

                                    // If it's the first bit (usually the main intro text)
                                    if (i === 0) return (
                                        <p key={i} className="text-base text-zinc-300 leading-relaxed">
                                            {trimmed}
                                        </p>
                                    );

                                    return (
                                        <div key={i} className="flex gap-3 text-sm text-zinc-400">
                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                                            <p className="leading-tight">{trimmed}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-zinc-400 leading-relaxed">{product.description}</p>
                        )}
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                    <WishlistButton
                        productId={product.id}
                        productSlug={product.slug}
                        isInWishlist={isInWishlist}
                        variant="button"
                    />
                    <ShareButton
                        productName={product.name}
                        productUrl={`/products/${product.slug}`}
                        productImage={primaryImageUrl}
                    />
                </div>

                <AddToCartForm
                    productId={product.id}
                    productSlug={product.slug}
                    productName={product.name}
                    variants={variants}
                    primaryImageUrl={primaryImageUrl}
                    images={images}
                    customizationRule={customizationRule}
                    productCategory={product.categories?.name}
                    // Controlled State
                    selectedColor={selectedColor}
                    onColorChange={setSelectedColor}
                    onVariantChange={(v) => setSelectedVariantId(v?.id ?? null)}
                    availableColors={colors}
                />

                <ProductReviews
                    productId={product.id}
                    productSlug={product.slug}
                    reviews={reviews}
                    userReview={userReview}
                    canSubmit={canSubmitReview}
                    orderIdFromQuery={orderIdFromQuery}
                    userId={userId}
                />

                {/* Creator Story Content */}
                <ProductStory story={storyContent || null} />
            </div>

            {/* Recent Purchase Toast (Global) */}
            <RecentPurchaseToast productId={product.id} />

            <StickyAddToCart
                productName={product.name}
                priceCents={lowestPrice}
                imageUrl={primaryImageUrl || ''}
                stock={totalStock}
            />
        </div>
    )
}
