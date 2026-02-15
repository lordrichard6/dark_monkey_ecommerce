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
        <select
          value={parentId}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={loading}
          className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategories - Smooth Expand/Collapse */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${activeParent && activeParent.subcategories && activeParent.subcategories.length > 0
          ? 'grid-rows-[1fr] opacity-100'
          : 'grid-rows-[0fr] opacity-0'
          }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Subcategory
            </label>
            <select
              value={subId}
              onChange={(e) => handleUpdate(e.target.value)}
              disabled={loading}
              className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            >
              <option value="">All {activeParent?.name}</option>
              {activeParent?.subcategories?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
