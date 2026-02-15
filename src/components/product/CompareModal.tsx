'use client'

import { createPortal } from 'react-dom'
import { X, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import { Product } from '@/types'
import { useEffect, useState } from 'react'
import { useCurrency } from '@/components/currency/CurrencyContext'
import Link from 'next/link'

type CompareModalProps = {
    isOpen: boolean
    onClose: () => void
    products: Product[]
}

export function CompareModal({ isOpen, onClose, products }: CompareModalProps) {
    const { format } = useCurrency()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = 'unset'
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    const features = [
        { label: 'Price', key: 'price_cents', format: (v: number) => format(v) },
        { label: 'Category', key: 'categories', get: (p: any) => p.categories?.name || '-' },
        {
            label: 'Rating', key: 'rating', render: (p: any) => (
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="text-sm">{p.rating || 'New'}</span>
                </div>
            )
        },
        { label: 'Description', key: 'description', className: 'text-xs line-clamp-3' },
    ]

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={onClose} />

            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-white/5 p-6">
                    <h2 className="text-xl font-bold text-white">Product Comparison</h2>
                    <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-zinc-400 hover:bg-white/10 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-x-auto p-6 md:p-8">
                    <table className="w-full min-w-[600px] border-collapse">
                        <thead>
                            <tr>
                                <th className="w-1/4 p-4 text-left font-medium text-zinc-500">Feature</th>
                                {products.map((product) => (
                                    <th key={product.id} className="w-1/4 p-4 align-top">
                                        <div className="space-y-4">
                                            <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-900">
                                                <Image
                                                    src={product.image_url || '/placeholder.png'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <Link href={`/products/${product.slug}`} className="block text-sm font-bold text-white hover:text-amber-500">
                                                {product.name}
                                            </Link>
                                        </div>
                                    </th>
                                ))}
                                {Array.from({ length: 3 - products.length }).map((_, i) => (
                                    <th key={i} className="w-1/4 p-4">
                                        <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-white/5 text-zinc-700">
                                            Empty Slot
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {features.map((feature) => (
                                <tr key={feature.label} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500">{feature.label}</td>
                                    {products.map((product) => (
                                        <td key={product.id} className={`p-4 text-sm text-zinc-300 ${feature.className || ''}`}>
                                            {feature.render ? feature.render(product) :
                                                feature.get ? feature.get(product) :
                                                    feature.format ? feature.format((product as any)[feature.key]) :
                                                        (product as any)[feature.key] || '-'}
                                        </td>
                                    ))}
                                    {Array.from({ length: 3 - products.length }).map((_, i) => (
                                        <td key={i} className="p-4" />
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <td className="p-4" />
                                {products.map((product) => (
                                    <td key={product.id} className="p-4">
                                        <Link
                                            href={`/products/${product.slug}`}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-zinc-200"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            View Item
                                        </Link>
                                    </td>
                                ))}
                                {Array.from({ length: 3 - products.length }).map((_, i) => (
                                    <td key={i} className="p-4" />
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
