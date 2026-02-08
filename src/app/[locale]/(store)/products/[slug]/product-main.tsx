'use client'

import { useState } from 'react'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import { AddToCartForm } from './add-to-cart-form'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ProductReviews } from '@/components/reviews/ProductReviews'
import type { ReviewRow } from '@/components/reviews/ProductReviews'
import { useTranslations } from 'next-intl'

type Props = {
    product: {
        id: string
        name: string
        slug: string
        description: string | null
        categories: { name?: string } | null
    }
    images: Array<{ url: string; alt: string | null; sort_order: number; color?: string | null }>
    variants: Array<any>
    reviews: ReviewRow[]
    userReview: ReviewRow | null
    isBestseller: boolean
    isInWishlist: boolean
    canSubmitReview: boolean
    orderIdFromQuery?: string
    primaryImageUrl?: string
    customizationRule?: any
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
}: Props) {
    const tProduct = useTranslations('product')

    // Derive available colors
    const colors = Array.from(
        new Set(variants.map((v) => (v.attributes?.color as string) || 'Default'))
    ).sort((a, b) => (a === 'Default' ? 1 : a.localeCompare(b)))

    const [selectedColor, setSelectedColor] = useState(colors[0] ?? 'Default')

    return (
        <div className="grid gap-8 md:grid-cols-2">
            {/* Left Column: Images */}
            <ProductImageGallery
                images={images}
                productName={product.name}
                selectedColor={selectedColor}
            />

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
                {product.description && (
                    <p className="mt-4 text-zinc-400">{product.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                    <WishlistButton
                        productId={product.id}
                        productSlug={product.slug}
                        isInWishlist={isInWishlist}
                        variant="button"
                    />
                </div>

                <AddToCartForm
                    productId={product.id}
                    productSlug={product.slug}
                    productName={product.name}
                    variants={variants}
                    primaryImageUrl={primaryImageUrl}
                    customizationRule={customizationRule}
                    productCategory={product.categories?.name}
                    // Controlled State
                    selectedColor={selectedColor}
                    onColorChange={setSelectedColor}
                    availableColors={colors}
                />

                <ProductReviews
                    productId={product.id}
                    productSlug={product.slug}
                    reviews={reviews}
                    userReview={userReview}
                    canSubmit={canSubmitReview}
                    orderIdFromQuery={orderIdFromQuery}
                />
            </div>
        </div>
    )
}
