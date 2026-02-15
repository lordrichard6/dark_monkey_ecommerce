import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Plus, Sparkles } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'

interface UpsellItem {
    id: string
    name: string
    priceCents: number
    imageUrl: string
    discountPercentage?: number
}

interface UpsellSectionProps {
    upsellItems: UpsellItem[]
    onAdd: (id: string) => void
}

export function UpsellSection({ upsellItems, onAdd }: UpsellSectionProps) {
    const t = useTranslations('checkout')
    const { format } = useCurrency()

    if (upsellItems.length === 0) return null

    return (
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                    {t('exclusiveOffers')}
                </h3>
            </div>

            <div className="space-y-4">
                {upsellItems.map((item) => (
                    <div
                        key={item.id}
                        className="group flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:border-white/10 sm:flex-row sm:items-center"
                    >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        <div className="flex-1">
                            <h4 className="font-medium text-white">{item.name}</h4>
                            <p className="mt-1 text-xs text-zinc-400">
                                {t('upsellPitch')} {item.discountPercentage && `${item.discountPercentage}% ${t('off')}`}
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-zinc-200">
                                    {format(item.priceCents)}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onAdd(item.id)}
                                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white hover:text-black"
                            >
                                <Plus className="h-3 w-3" />
                                {t('addToOrder')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
