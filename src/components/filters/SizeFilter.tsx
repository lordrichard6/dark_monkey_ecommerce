'use client'

import { useTranslations } from 'next-intl'

type Props = {
  sizes: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function SizeFilter({ sizes, selected, onChange }: Props) {
  const t = useTranslations('filters')

  const toggle = (size: string) => {
    const sizeUpper = size.toUpperCase()
    if (selected.includes(sizeUpper)) {
      onChange(selected.filter((s) => s !== sizeUpper))
    } else {
      onChange([...selected, sizeUpper])
    }
  }

  if (sizes.length === 0) {
    return null
  }

  // Sort sizes in standard order
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const sortedSizes = [...sizes].sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a.toUpperCase())
    const bIndex = sizeOrder.indexOf(b.toUpperCase())
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-zinc-50">{t('sizes')}</h3>
      <div className="flex flex-wrap gap-2">
        {sortedSizes.map((size) => {
          const sizeUpper = size.toUpperCase()
          const isSelected = selected.includes(sizeUpper)

          return (
            <button
              key={size}
              type="button"
              onClick={() => toggle(size)}
              className={`min-w-[3rem] rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-zinc-400 bg-zinc-800 text-zinc-50 ring-2 ring-zinc-500 ring-offset-2 ring-offset-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800'
              }`}
              aria-label={`Size ${size} ${isSelected ? '(selected)' : ''}`}
            >
              {size.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
