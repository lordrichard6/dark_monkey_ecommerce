import { createClient } from '@/lib/supabase/server'
import { getFrequentlyBoughtTogether } from '@/lib/recommendations'
import { ProductCard } from './ProductCard'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'

interface FrequentlyBoughtProps {
    productId: string
    locale: string
}

export async function FrequentlyBought({ productId, locale }: FrequentlyBoughtProps) {
    const supabase = await createClient()
    const t = await getTranslations('product')

    const recommendations = await getFrequentlyBoughtTogether(supabase, productId, 2)

    if (recommendations.length === 0) return null

    return (
        <section className="mt-20 rounded-2xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-sm">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-white">
                    {t('frequentlyBoughtTogether')}
                </h2>
                <p className="text-sm text-zinc-400">
                    {t('frequentlyBoughtTogetherSubtitle')}
                </p>
            </div>

            <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch">
                <div className="w-full max-w-[200px]">
                    {/* Current product would go here if we had its data, but we can just show recommendations */}
                </div>

                {recommendations.map((product, index) => (
                    <div key={product.id} className="flex flex-col items-center gap-6 md:flex-row">
                        {index === 0 && (
                            <div className="flex items-center justify-center p-2 text-zinc-500">
                                <Plus className="h-6 w-6" />
                            </div>
                        )}
                        <div className="w-full max-w-[200px]">
                            <ProductCard
                                id={product.id}
                                key={product.id}
                                slug={product.slug}
                                name={product.name}
                                priceCents={product.price_cents || 0}
                                imageUrl={Array.isArray(product.product_images) ? (product.product_images[0] as any)?.url : ''}
                                imageAlt={product.name}
                                fullProduct={product}
                            />
                        </div>
                        {index < recommendations.length - 1 && (
                            <div className="flex items-center justify-center p-2 text-zinc-500">
                                <Plus className="h-6 w-6" />
                            </div>
                        )}
                    </div>
                ))}

                <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl bg-white/5 p-6 md:mt-0">
                    <div className="text-sm text-zinc-400">{t('bundleTotal')}</div>
                    <div className="mt-1 text-2xl font-bold text-white">
                        {/* Logic for total price calculation would go here */}
                        {t('bundlePriceComingSoon')}
                    </div>
                    <button className="mt-4 w-full rounded-lg bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors">
                        {t('addAllToCart')}
                    </button>
                </div>
            </div>
        </section>
    )
}
