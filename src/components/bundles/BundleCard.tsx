import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/components/currency/CurrencyContext'

interface BundleCardProps {
    name: string
    description: string
    priceCents: number
    compareAtPriceCents?: number
    items: { name: string; imageUrl: string }[]
    imageUrl?: string
}

export function BundleCard({
    name,
    description,
    priceCents,
    compareAtPriceCents,
    items,
    imageUrl,
}: BundleCardProps) {
    const t = useTranslations('product')
    const { format } = useCurrency()

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 transition-all hover:border-amber-500/30">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                {/* Main Bundle Image or Graphic */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800 lg:w-1/3">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-600">
                            {/* Fallback pattern or icon */}
                            <div className="text-4xl font-bold opacity-10">BUNDLE</div>
                        </div>
                    )}
                    <div className="absolute top-4 left-4">
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                            {t('bundle')}
                        </span>
                    </div>
                </div>

                {/* Bundle Details */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white lg:text-2xl">{name}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{description}</p>

                    <div className="mt-6 flex flex-wrap gap-4">
                        {items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-800">
                                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                </div>
                                <span className="text-xs text-zinc-500">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing & CTA */}
                <div className="mt-6 flex flex-col items-start gap-4 lg:mt-0 lg:items-end lg:border-l lg:border-white/5 lg:pl-8">
                    <div className="flex flex-col lg:items-end">
                        {compareAtPriceCents && (
                            <span className="text-sm text-zinc-500 line-through">
                                {format(compareAtPriceCents)}
                            </span>
                        )}
                        <span className="text-3xl font-black text-white">
                            {format(priceCents)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                            {t('saveAmount')}
                        </span>
                    </div>
                    <button className="w-full rounded-xl bg-white px-8 py-3 text-sm font-bold text-black transition-transform active:scale-95 hover:bg-zinc-100 lg:w-auto">
                        {t('addAllToCart')}
                    </button>
                </div>
            </div>
        </div>
    )
}
