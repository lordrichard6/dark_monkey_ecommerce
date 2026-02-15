'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { getProductQuickView } from '@/actions/products'
import { AddToCartForm } from '@/app/[locale]/(store)/products/[slug]/add-to-cart-form'
import { ProductImageGallery } from './ProductImageGallery'
import { useTranslations } from 'next-intl'

type QuickViewModalProps = {
    slug: string
    isOpen: boolean
    onClose: () => void
}

export function QuickViewModal({ slug, isOpen, onClose }: QuickViewModalProps) {
    const t = useTranslations('product')
    const [product, setProduct] = useState<any>(null)
    const [customizationRule, setCustomizationRule] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen && slug) {
            setLoading(true)
            getProductQuickView(slug).then((res) => {
                if (res.data) {
                    setProduct(res.data)
                    setCustomizationRule(res.customizationRule)
                }
                setLoading(false)
            })
        }
    }, [isOpen, slug])

    // Prevent scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-zinc-400 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="h-full overflow-y-auto overflow-x-hidden p-6 md:p-8">
                    {loading ? (
                        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                            <p className="text-sm text-zinc-500">Loading product details...</p>
                        </div>
                    ) : product ? (
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="relative group">
                                <ProductImageGallery
                                    images={product.product_images}
                                    productName={product.name}
                                />
                            </div>

                            <div className="flex flex-col">
                                <h2 className="text-2xl font-bold text-white md:text-3xl">
                                    {product.name}
                                </h2>

                                <div className="mt-4 flex flex-col gap-4">
                                    <p className="text-zinc-400 line-clamp-4 leading-relaxed">
                                        {product.description}
                                    </p>

                                    <AddToCartForm
                                        productId={product.id}
                                        productSlug={product.slug}
                                        productName={product.name}
                                        variants={(product.product_variants || []).map((v: any) => ({
                                            ...v,
                                            stock: Array.isArray(v.product_inventory)
                                                ? (v.product_inventory[0]?.quantity ?? 0)
                                                : (v.product_inventory?.quantity ?? 0)
                                        }))}
                                        primaryImageUrl={product.product_images?.[0]?.url}
                                        images={product.product_images}
                                        customizationRule={customizationRule}
                                        productCategory={product.categories?.name}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                            <p className="text-zinc-400">Failed to load product details.</p>
                            <button
                                onClick={onClose}
                                className="text-sm text-amber-500 hover:underline"
                            >
                                Go back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
