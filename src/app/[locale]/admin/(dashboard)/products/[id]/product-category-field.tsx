'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct } from '@/actions/admin-products'
import type { Category } from '@/actions/admin-categories'

type Props = {
  productId: string
  categoryId: string | null
  categories: Category[]
}

export function ProductCategoryField({ productId, categoryId, categories }: Props) {
  const router = useRouter()

  const roots = categories.filter((c) => !c.parent_id)
  const subsOf = (rootId: string) => categories.filter((c) => c.parent_id === rootId)

  // Determine initial parent by searching only root categories:
  // - if the product's category IS a root → initialParent is that root, no subcategory selected
  // - if the product's category is a subcategory → initialParent is the root that owns it
  const initialParent = roots.find(
    (c) => c.id === categoryId || subsOf(c.id).some((s) => s.id === categoryId)
  )

  // subId is only set when categoryId belongs to a subcategory (not a root)
  const initialSubId =
    categoryId && initialParent && initialParent.id !== categoryId ? categoryId : ''

  const [parentId, setParentId] = useState(initialParent?.id ?? '')
  const [subId, setSubId] = useState(initialSubId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeParent = roots.find((c) => c.id === parentId)
  const activeSubs = parentId ? subsOf(parentId) : []

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
      setError(result.error ?? null)
    }
  }

  function handleParentChange(newParentId: string) {
    setParentId(newParentId)
    if (newParentId === '') {
      handleUpdate('')
    } else if (!subsOf(newParentId).some((s) => s.id === subId)) {
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
          {roots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategories - Smooth Expand/Collapse */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
          activeSubs.length > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
              {activeSubs.map((s) => (
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
