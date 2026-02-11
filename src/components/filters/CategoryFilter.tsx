'use client'

import { useTranslations } from 'next-intl'

type Category = {
  id: string
  name: string
  count?: number
}

type Props = {
  categories: Category[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function CategoryFilter({ categories, selected, onChange }: Props) {
  const t = useTranslations('filters')

  const toggle = (categoryId: string) => {
    if (selected.includes(categoryId)) {
      onChange(selected.filter((id) => id !== categoryId))
    } else {
      onChange([...selected, categoryId])
    }
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-zinc-50">{t('categories')}</h3>
      <div className="space-y-2">
        {categories.map((cat) => (
          <label
            key={cat.id}
            className="flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-zinc-200"
          >
            <input
              type="checkbox"
              checked={selected.includes(cat.id)}
              onChange={() => toggle(cat.id)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-50 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-0"
            />
            <span className="flex-1 text-zinc-300">{cat.name}</span>
            {cat.count !== undefined && (
              <span className="text-xs text-zinc-500">({cat.count})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
