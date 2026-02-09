'use client'

import { useState } from 'react'
import { ProductImageManager } from './product-image-manager'
import { ProductDetailAdmin } from './product-detail-admin'
import { ColorOption } from '@/types/product'

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
        compare_at_price_cents: number | null
        attributes: Record<string, unknown>
        product_inventory: any
    }>
}

export function ProductEditor({ productId, images, variants }: Props) {
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

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Images Section */}
            <div className="order-2 lg:order-1">
                <div className="sticky top-4 z-30 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Product Images</h3>
                    <ProductImageManager
                        productId={productId}
                        images={images}
                        selectedColor={selectedColor}
                        availableColors={colors.map(c => c.name)}
                    />
                </div>
            </div>

            {/* Variants & Stock Section */}
            <div className="order-1 space-y-6 lg:order-2">
                <div>
                    <ProductDetailAdmin
                        productId={productId}
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
