'use client'

import { useState, useMemo } from 'react'
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
  charcoal: '#374151',
  graphite: '#1F2937',
  silver: '#C0C0C0',
  gold: '#D4AF37',
  brown: '#92400E',
  orange: '#F97316',
  navy: '#1E3A8A',
  beige: '#D4C5B0',
  cream: '#FFFDD0',
}

export function ColorFilter({ colors, selected, onChange }: Props) {
  const t = useTranslations('filters')

  // Group similar color names that map to the same hex to avoid visual duplicates
  const groupedColors = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const color of colors) {
      const hex = COLOR_MAP[color.toLowerCase()] || '#6B7280'
      if (!map.has(hex)) map.set(hex, [])
      map.get(hex)?.push(color)
    }
    return Array.from(map.entries()).map(([hex, names]) => ({
      hex,
      names,
      primaryName: names[0],
    }))
  }, [colors])

  const toggle = (hex: string, names: string[]) => {
    const namesLower = names.map(n => n.toLowerCase())
    const anySelected = namesLower.some(n => selected.includes(n))

    if (anySelected) {
      // Remove all names in this group from selection
      onChange(selected.filter((s) => !namesLower.includes(s)))
    } else {
      // Add the first name as the representative
      onChange([...selected, namesLower[0]])
    }
  }

  if (colors.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-zinc-50">{t('colors')}</h3>
      <div className="flex flex-wrap gap-2">
        {groupedColors.map(({ hex, names, primaryName }) => {
          const isSelected = names.some(n => selected.includes(n.toLowerCase()))

          return (
            <button
              key={hex}
              type="button"
              onClick={() => toggle(hex, names)}
              className={`relative h-10 w-10 rounded-full border-2 transition-all ${isSelected
                ? 'border-zinc-400 ring-2 ring-zinc-500 ring-offset-2 ring-offset-black'
                : 'border-zinc-700 hover:border-zinc-500'
                }`}
              style={{ backgroundColor: hex }}
              aria-label={`${primaryName} ${isSelected ? '(selected)' : ''}`}
              title={names.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(', ')}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className="h-5 w-5"
                    style={{
                      color: hex === '#FFFFFF' || hex === '#FFFDD0' || hex === '#D4C5B0' || hex === '#C0C0C0' ? '#000000' : '#FFFFFF',
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
