'use client'

import { useCompare } from '@/lib/store/use-compare'
import { X, ArrowRightLeft, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { CompareModal } from './CompareModal'
import { useTranslations } from 'next-intl'

export function CompareBar() {
    const t = useTranslations('product')
    const { products, removeProduct, clearProducts } = useCompare()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || products.length === 0) return null

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 pointer-events-none">
                <div className="mx-auto max-w-4xl pointer-events-auto">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                            <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                <ArrowRightLeft className="h-5 w-5" />
                            </div>

                            <div className="flex gap-3">
                                {products.map((product) => (
                                    <div key={product.id} className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800 border border-white/5">
                                        <Image
                                            src={product.image_url || '/placeholder.png'}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => removeProduct(product.id)}
                                            className="absolute -right-1 -top-1 z-10 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                {Array.from({ length: 3 - products.length }).map((_, i) => (
                                    <div key={i} className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-white/5 bg-white/5 text-zinc-600">
                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Add</span>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden sm:block ml-2">
                                <p className="text-sm font-medium text-white">
                                    {products.length} {products.length === 1 ? 'Product' : 'Products'}
                                </p>
                                <p className="text-[11px] text-zinc-500">Compare up to 3</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearProducts}
                                className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear
                            </button>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                disabled={products.length < 2}
                                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                            >
                                Compare Now
                                <ArrowRightLeft className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CompareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                products={products}
            />
        </>
    )
}
