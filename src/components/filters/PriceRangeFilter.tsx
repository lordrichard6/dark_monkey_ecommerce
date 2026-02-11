'use client'

import { useTranslations } from 'next-intl'

type Props = {
  min: number
  max: number
  currentMin: number
  currentMax: number
  onChange: (min: number, max: number) => void
  currency?: string
}

export function PriceRangeFilter({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
  currency = 'CHF',
}: Props) {
  const t = useTranslations('filters')

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, currentMax)
    onChange(newMin, currentMax)
  }

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, currentMin)
    onChange(currentMin, newMax)
  }

  const formatPrice = (cents: number) => {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-zinc-50">{t('priceRange')}</h3>

      {/* Price range display */}
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>{formatPrice(currentMin)}</span>
        <span>{formatPrice(currentMax)}</span>
      </div>

      {/* Dual range slider */}
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-zinc-800" />
        <div
          className="absolute h-full rounded-full bg-zinc-600"
          style={{
            left: `${((currentMin - min) / (max - min)) * 100}%`,
            right: `${100 - ((currentMax - min) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={currentMin}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-50 [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={currentMax}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-50 [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Manual input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Math.floor(currentMin / 100)}
          onChange={(e) => handleMinChange(parseInt(e.target.value) * 100 || 0)}
          className="w-24 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          placeholder="Min"
        />
        <span className="text-zinc-500">—</span>
        <input
          type="number"
          value={Math.floor(currentMax / 100)}
          onChange={(e) => handleMaxChange(parseInt(e.target.value) * 100 || 0)}
          className="w-24 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          placeholder="Max"
        />
      </div>
    </div>
  )
}
