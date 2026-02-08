'use client'

import { useState } from 'react'
import { ProductImageManager } from './product-image-manager'
import { ProductDetailAdmin } from './product-detail-admin'

type Props = {
    productId: string
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
        attributes: Record<string, unknown>
        product_inventory: any
    }>
}

export function ProductEditor({ productId, images, variants }: Props) {
    // Derive available colors from variants
    const colors = Array.from(
        new Set(variants.map((v) => (v.attributes?.color as string) || 'Default'))
    ).sort((a, b) => (a === 'Default' ? 1 : a.localeCompare(b)))

    const defaultColor = colors[0] ?? 'Default'
    const [selectedColor, setSelectedColor] = useState(defaultColor)

    return (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Images Section */}
            <div className="order-2 lg:order-1">
                <div className="sticky top-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Product Images</h3>
                    <ProductImageManager
                        productId={productId}
                        images={images}
                        selectedColor={selectedColor}
                    />
                </div>
            </div>

            {/* Variants & Stock Section */}
            <div className="order-1 space-y-6 lg:order-2">
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-zinc-50">Variants & Stock</h2>
                    <ProductDetailAdmin
                        variants={variants}
                        selectedColor={selectedColor}
                        onColorChange={setSelectedColor}
                        availableColors={colors}
                    />
                </div>
            </div>
        </div>
    )
}
