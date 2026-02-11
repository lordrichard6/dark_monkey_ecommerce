'use client'

import { useTranslations } from 'next-intl'
import { PriceRangeFilter } from './PriceRangeFilter'
import { CategoryFilter } from './CategoryFilter'
import { ColorFilter } from './ColorFilter'
import { SizeFilter } from './SizeFilter'
import { FilterState, hasActiveFilters } from '@/lib/product-filtering'
import { X } from 'lucide-react'

type Category = {
  id: string
  name: string
  count?: number
}

type Props = {
  categories: Category[]
  colors: string[]
  sizes: string[]
  priceRange: { min: number; max: number }
  filters: FilterState
  initialFilters: FilterState
  onFilterChange: (filters: FilterState) => void
  currency?: string
}

export function FilterSidebar({
  categories,
  colors,
  sizes,
  priceRange,
  filters,
  initialFilters,
  onFilterChange,
  currency = 'CHF',
}: Props) {
  const t = useTranslations('filters')

  const updateFilters = (updates: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...updates })
  }

  const resetFilters = () => {
    onFilterChange(initialFilters)
  }

  const isFiltered = hasActiveFilters(filters, initialFilters)

  return (
    <div className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-50">{t('filters')}</h2>
        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
            {t('reset')}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Price Range */}
      <PriceRangeFilter
        min={priceRange.min}
        max={priceRange.max}
        currentMin={filters.priceMin}
        currentMax={filters.priceMax}
        onChange={(min, max) =>
          updateFilters({ priceMin: min, priceMax: max })
        }
        currency={currency}
      />

      {/* Divider */}
      {categories.length > 0 && <div className="border-t border-zinc-800" />}

      {/* Categories */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selected={filters.categories}
          onChange={(categories) => updateFilters({ categories })}
        />
      )}

      {/* Divider */}
      {colors.length > 0 && <div className="border-t border-zinc-800" />}

      {/* Colors */}
      {colors.length > 0 && (
        <ColorFilter
          colors={colors}
          selected={filters.colors}
          onChange={(colors) => updateFilters({ colors })}
        />
      )}

      {/* Divider */}
      {sizes.length > 0 && <div className="border-t border-zinc-800" />}

      {/* Sizes */}
      {sizes.length > 0 && (
        <SizeFilter
          sizes={sizes}
          selected={filters.sizes}
          onChange={(sizes) => updateFilters({ sizes })}
        />
      )}

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* In Stock Only */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => updateFilters({ inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-50 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-0"
          />
          <span className="text-zinc-300">{t('inStockOnly')}</span>
        </label>
      </div>

      {/* Active filter count */}
      {isFiltered && (
        <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
          <p className="text-sm text-zinc-400">
            {t('activeFilters', { count: getActiveFilterCount(filters, initialFilters) })}
          </p>
        </div>
      )}
    </div>
  )
}

function getActiveFilterCount(filters: FilterState, initialFilters: FilterState): number {
  let count = 0

  if (filters.priceMin !== initialFilters.priceMin || filters.priceMax !== initialFilters.priceMax) {
    count++
  }
  if (filters.categories.length > 0) count++
  if (filters.colors.length > 0) count++
  if (filters.sizes.length > 0) count++
  if (filters.inStockOnly) count++

  return count
}
