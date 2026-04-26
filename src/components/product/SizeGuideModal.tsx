'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Ruler } from 'lucide-react'
import { useTranslations } from 'next-intl'

type SizeGuideModalProps = {
  productCategory?: string
  sizeGuideUrl?: string | null
}

// Units toggle — user preference shown in the modal
type Unit = 'cm' | 'in'

// Convert cm -> in, rounded to half-inch for readability.
function cmToInches(cm: string): string {
  // Range like "91-97"
  if (cm.includes('-') || cm.includes('–')) {
    const [a, b] = cm.split(/[-–]/).map((v) => Number(v.trim()))
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return `${(a / 2.54).toFixed(0)}–${(b / 2.54).toFixed(0)}`
    }
  }
  const n = Number(cm)
  if (Number.isFinite(n)) return `${(n / 2.54).toFixed(0)}`
  return cm
}

// Determine the relevant chart from the product's category name.
// Falls back to apparel (most common for this store).
type ChartShape = {
  kind: 'apparel' | 'hat' | 'accessory'
  headers: string[]
  rows: string[][]
  // Which cells are measurements (so we know where to convert cm→in)
  measurementColumns: number[]
}

function resolveChart(
  category: string | undefined,
  t: (k: string) => string,
  unit: Unit
): ChartShape {
  const c = category?.toLowerCase() ?? ''

  // Hats / caps
  if (c.includes('hat') || c.includes('cap') || c.includes('beanie')) {
    const rows = [
      [t('sizeOneSize'), '56–60'],
      [t('sizeYouth'), '52–54'],
    ]
    return {
      kind: 'hat',
      headers: [t('size'), t('hatCircumference')],
      rows: rows.map((r) => (unit === 'in' ? [r[0], cmToInches(r[1])] : r)),
      measurementColumns: [1],
    }
  }

  // Phone cases / tech accessories — no sizing chart, but fit advice
  if (c.includes('case') || c.includes('phone') || c.includes('mug') || c.includes('bottle')) {
    return {
      kind: 'accessory',
      headers: [],
      rows: [],
      measurementColumns: [],
    }
  }

  // Apparel (default) — unisex T-shirts, hoodies, sweatshirts
  const cmRows = [
    ['XS', '84–91', '66', '61'],
    ['S', '91–97', '69', '63'],
    ['M', '97–104', '71', '65'],
    ['L', '104–112', '74', '67'],
    ['XL', '112–119', '76', '69'],
    ['2XL', '119–127', '79', '71'],
    ['3XL', '127–135', '81', '73'],
  ]
  return {
    kind: 'apparel',
    headers: [t('size'), t('chest'), t('length'), t('sleeve')],
    rows:
      unit === 'in'
        ? cmRows.map((r) => [r[0], cmToInches(r[1]), cmToInches(r[2]), cmToInches(r[3])])
        : cmRows,
    measurementColumns: [1, 2, 3],
  }
}

export function SizeGuideModal({ productCategory, sizeGuideUrl }: SizeGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unit, setUnit] = useState<Unit>('cm')
  const t = useTranslations('product')

  const chart = resolveChart(productCategory, t, unit)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 hover:text-amber-400 transition-colors"
      >
        <Ruler className="h-3 w-3" />
        {t('sizeGuide')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              aria-label={t('close')}
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-1 text-xl font-bold text-white">{t('sizeGuideTitle')}</h2>

            {sizeGuideUrl ? (
              // Admin-provided custom size guide image
              <Image
                src={sizeGuideUrl}
                alt={t('sizeGuideTitle')}
                width={800}
                height={800}
                className="w-full rounded-xl"
                unoptimized
              />
            ) : chart.kind === 'accessory' ? (
              // Accessory/case/mug — no chart, just fit notes
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-400">{t('sizeGuideAccessoryNote')}</p>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {t('sizeGuideAccessoryBody')}
                </p>
              </div>
            ) : (
              <>
                {/* Units toggle — CH users are mixed cm/in, UK/US buyers need inches */}
                <div className="mb-4 mt-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">{t('sizeGuideUnitsHint')}</p>
                  <div
                    className="inline-flex rounded-full border border-white/10 bg-white/5 p-0.5"
                    role="group"
                    aria-label={t('sizeGuideUnitsHint')}
                  >
                    <button
                      type="button"
                      onClick={() => setUnit('cm')}
                      aria-pressed={unit === 'cm'}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                        unit === 'cm'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('in')}
                      aria-pressed={unit === 'in'}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                        unit === 'in'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      in
                    </button>
                  </div>
                </div>

                <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-400">
                    {unit === 'cm' ? t('sizeGuideNote') : t('sizeGuideNoteInches')}
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
                            <td
                              key={j}
                              className={`p-3 text-sm ${j === 0 ? 'font-medium text-white' : 'text-zinc-400'}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fit advice — reduces "will it fit me?" anxiety, lowers returns */}
                {chart.kind === 'apparel' && (
                  <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                      {t('sizeGuideFitTipLabel')}
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-300">
                      {t('sizeGuideFitTipBody')}
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-white">{t('howToMeasure')}</h3>
                  <div className="space-y-2 text-sm text-zinc-400">
                    {chart.kind === 'apparel' ? (
                      <>
                        <p>
                          <strong className="text-zinc-300">{t('chest')}:</strong>{' '}
                          {t('chestMeasurement')}
                        </p>
                        <p>
                          <strong className="text-zinc-300">{t('length')}:</strong>{' '}
                          {t('lengthMeasurement')}
                        </p>
                        <p>
                          <strong className="text-zinc-300">{t('sleeve')}:</strong>{' '}
                          {t('sleeveMeasurement')}
                        </p>
                      </>
                    ) : (
                      <p>
                        <strong className="text-zinc-300">{t('hatCircumference')}:</strong>{' '}
                        {t('hatMeasurement')}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
