'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct } from '@/actions/admin-products'

import { CATEGORIES } from '@/lib/categories'

type Props = {
  productId: string
  categoryId: string | null
}

export function ProductCategoryField({
  productId,
  categoryId,
}: Props) {
  const router = useRouter()

  // Find initial parent ID
  const initialParent = CATEGORIES.find(cat =>
    cat.id === categoryId || cat.subcategories?.some(sub => sub.id === categoryId)
  )

  const [parentId, setParentId] = useState(initialParent?.id ?? '')
  const [subId, setSubId] = useState(categoryId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeParent = CATEGORIES.find(c => c.id === parentId)

  async function handleUpdate(newSubId: string) {
    setSubId(newSubId)
    setLoading(true)
    setError(null)
    const result = await updateProduct(productId, {
      category_id: newSubId || null,
    })
    setLoading(false)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error)
      // Rollback on error? Maybe not always desirable, but for simplicity:
      // setSubId(categoryId ?? '')
    }
  }

  function handleParentChange(newParentId: string) {
    setParentId(newParentId)
    // When parent changes, we don't necessarily update the product yet 
    // unless we decide that the parent ID itself is a valid category_id
    // For now, let's keep the subId as is if it belongs to the new parent, otherwise clear it
    const newParent = CATEGORIES.find(c => c.id === newParentId)
    if (newParentId === '') {
      handleUpdate('')
    } else if (newParent?.subcategories?.some(s => s.id === subId)) {
      // subId is already fine
    } else {
      // Clear subcategory when parent changes and current subId doesn't belong
      setSubId('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Parent Categories */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleParentChange('')}
            disabled={loading}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${parentId === ''
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700'
              } disabled:opacity-50`}
          >
            None
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleParentChange(c.id)}
              disabled={loading}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${parentId === c.id
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700'
                } disabled:opacity-50`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {activeParent && activeParent.subcategories && activeParent.subcategories.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Subcategory
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleUpdate('')}
              disabled={loading}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${subId === ''
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800'
                } disabled:opacity-50`}
            >
              All {activeParent.name}
            </button>
            {activeParent.subcategories.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleUpdate(s.id)}
                disabled={loading}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${subId === s.id
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800'
                  } disabled:opacity-50`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
