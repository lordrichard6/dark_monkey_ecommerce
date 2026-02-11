'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

type Props = {
  colors: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

// Map color names to CSS colors
const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  purple: '#A855F7',
  pink: '#EC4899',
  gray: '#6B7280',
  grey: '#6B7280',
  brown: '#92400E',
  orange: '#F97316',
  navy: '#1E3A8A',
  beige: '#D4C5B0',
  cream: '#FFFDD0',
}

export function ColorFilter({ colors, selected, onChange }: Props) {
  const t = useTranslations('filters')

  const toggle = (color: string) => {
    const colorLower = color.toLowerCase()
    if (selected.includes(colorLower)) {
      onChange(selected.filter((c) => c !== colorLower))
    } else {
      onChange([...selected, colorLower])
    }
  }

  const getColorHex = (colorName: string): string => {
    const normalized = colorName.toLowerCase()
    return COLOR_MAP[normalized] || '#6B7280' // Default to gray
  }

  if (colors.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-zinc-50">{t('colors')}</h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const colorLower = color.toLowerCase()
          const isSelected = selected.includes(colorLower)
          const hexColor = getColorHex(colorLower)

          return (
            <button
              key={color}
              type="button"
              onClick={() => toggle(color)}
              className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                isSelected
                  ? 'border-zinc-400 ring-2 ring-zinc-500 ring-offset-2 ring-offset-black'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: hexColor }}
              aria-label={`${color} ${isSelected ? '(selected)' : ''}`}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className="h-5 w-5"
                    style={{
                      color: hexColor === '#FFFFFF' || hexColor === '#FFFDD0' || hexColor === '#D4C5B0' ? '#000000' : '#FFFFFF',
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
