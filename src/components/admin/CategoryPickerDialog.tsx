'use client'

import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { updateProduct } from '@/actions/admin-products'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export type PickerCategory = {
  id: string
  name: string
  parent_id: string | null
}

type Props = {
  productId: string
  productName: string
  currentCategoryId: string | null
  categories: PickerCategory[]
  onClose: () => void
}

export function CategoryPickerDialog({
  productId,
  productName,
  currentCategoryId,
  categories,
  onClose,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  const parents = categories.filter((c) => !c.parent_id)
  const subsOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  async function handleSelect(categoryId: string | null) {
    setSaving(true)
    const result = await updateProduct(productId, { category_id: categoryId })
    setSaving(false)
    if (result.ok) {
      toast.success('Category updated')
      router.refresh()
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  const activeSubs = selectedParentId ? subsOf(selectedParentId) : []
  const selectedParentName = parents.find((p) => p.id === selectedParentId)?.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Set Category</h2>
            <p className="mt-0.5 max-w-[300px] truncate text-xs text-zinc-500">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!selectedParentId ? (
            <>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Select a theme
              </p>
              <div className="grid grid-cols-2 gap-2">
                {parents.map((parent) => {
                  const subCount = subsOf(parent.id).length
                  return (
                    <button
                      key={parent.id}
                      onClick={() => setSelectedParentId(parent.id)}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900 px-4 py-3 text-left text-sm font-medium text-zinc-200 transition-colors hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white"
                    >
                      <span>{parent.name}</span>
                      <div className="flex items-center gap-1.5">
                        {subCount > 0 && <span className="text-xs text-zinc-600">{subCount}</span>}
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handleSelect(null)}
                disabled={saving}
                className="mt-4 w-full rounded-lg border border-dashed border-zinc-800 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-600 hover:text-zinc-400 disabled:opacity-50"
              >
                Clear category
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedParentId(null)}
                className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {selectedParentName}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Option: assign to parent itself ("All") */}
                <button
                  onClick={() => handleSelect(selectedParentId)}
                  disabled={saving}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
                    currentCategoryId === selectedParentId
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                      : 'border-white/5 bg-zinc-900 text-zinc-200 hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span>All {selectedParentName}</span>
                  {currentCategoryId === selectedParentId && (
                    <Check className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </button>

                {activeSubs.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelect(sub.id)}
                    disabled={saving}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
                      currentCategoryId === sub.id
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                        : 'border-white/5 bg-zinc-900 text-zinc-200 hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{sub.name}</span>
                    {currentCategoryId === sub.id && (
                      <Check className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {saving && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/80">
            <p className="text-sm text-zinc-400">Saving...</p>
          </div>
        )}
      </div>
    </div>
  )
}
