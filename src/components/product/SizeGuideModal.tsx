'use client'

import { useState } from 'react'
import { X, Ruler } from 'lucide-react'
import { useTranslations } from 'next-intl'

type SizeGuideModalProps = {
    productCategory?: string
}

export function SizeGuideModal({ productCategory }: SizeGuideModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const t = useTranslations('product')

    // Different size charts based on category
    const getSizeChart = () => {
        const category = productCategory?.toLowerCase() || ''

        if (category.includes('hoodie') || category.includes('shirt') || category.includes('apparel') || category.includes('clothing')) {
            return {
                headers: [t('size'), t('chest'), t('length'), t('sleeve')],
                rows: [
                    ['XS', '84-91', '66', '61'],
                    ['S', '91-97', '69', '63'],
                    ['M', '97-104', '71', '65'],
                    ['L', '104-112', '74', '67'],
                    ['XL', '112-119', '76', '69'],
                    ['2XL', '119-127', '79', '71'],
                    ['3XL', '127-135', '81', '73'],
                ]
            }
        }

        // Default measurements
        return {
            headers: [t('size'), t('measurement')],
            rows: [
                ['S', 'Small'],
                ['M', 'Medium'],
                ['L', 'Large'],
            ]
        }
    }

    const chart = getSizeChart()

    if (!productCategory) return null

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 underline"
            >
                <Ruler className="h-4 w-4" />
                {t('sizeGuide')}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="mb-4 text-2xl font-bold text-white">{t('sizeGuideTitle')}</h2>

                        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                            <p className="text-sm text-amber-400">
                                {t('sizeGuideNote')}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-700">
                                        {chart.headers.map((header, i) => (
                                            <th key={i} className="p-3 text-left text-sm font-semibold text-zinc-300">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {chart.rows.map((row, i) => (
                                        <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                            {row.map((cell, j) => (
                                                <td key={j} className={`p-3 text-sm ${j === 0 ? 'font-medium text-white' : 'text-zinc-400'}`}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 space-y-4">
                            <h3 className="font-semibold text-white">{t('howToMeasure')}</h3>
                            <div className="space-y-2 text-sm text-zinc-400">
                                <p><strong className="text-zinc-300">{t('chest')}:</strong> {t('chestMeasurement')}</p>
                                <p><strong className="text-zinc-300">{t('length')}:</strong> {t('lengthMeasurement')}</p>
                                <p><strong className="text-zinc-300">{t('sleeve')}:</strong> {t('sleeveMeasurement')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
