'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/actions/admin-products'

import { CATEGORIES } from '@/lib/categories'

type Tag = { id: string; name: string }

type Props = {
  availableTags: Tag[]
}

export function CreateProductForm({ availableTags }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedSubId, setSelectedSubId] = useState('')

  const activeParent = CATEGORIES.find(c => c.id === selectedParentId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await createProduct({
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: (formData.get('description') as string) || undefined,
      categoryId: selectedSubId || undefined,
      isCustomizable: formData.get('isCustomizable') === 'on',
      variantName: formData.get('variantName') as string,
      priceCents: Math.round(parseFloat(formData.get('priceCents') as string) * 100),
      stock: parseInt(formData.get('stock') as string, 10) || 0,
      imageUrl: formData.get('imageUrl') as string || undefined,
      tagIds: selectedTagIds,
    })
    setLoading(false)
    if (result.ok && result.productId) {
      router.push(`/admin/products/${result.productId}`)
    } else {
      setError('error' in result ? result.error : 'Failed to create')
    }
  }

  function handleParentChange(id: string) {
    setSelectedParentId(id)
    setSelectedSubId('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-300">Name</label>
          <input
            name="name"
            required
            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">Slug</label>
          <input
            name="slug"
            required
            placeholder="product-slug"
            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Description</label>
        <textarea
          name="description"
          rows={2}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>

      <div className="space-y-6">
        {/* Parent Categories */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleParentChange('')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${selectedParentId === ''
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700'
                }`}
            >
              None
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleParentChange(c.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${selectedParentId === c.id
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories */}
        {activeParent && activeParent.subcategories && activeParent.subcategories.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Subcategory
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubId('')}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${selectedSubId === ''
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800'
                  }`}
              >
                All {activeParent.name}
              </button>
              {activeParent.subcategories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSubId(s.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${selectedSubId === s.id
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800'
                    }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="isCustomizable" className="rounded border-zinc-600 bg-zinc-800" />
        <span className="text-sm text-zinc-300">Customizable</span>
      </label>
      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-medium text-zinc-400">Initial variant</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm text-zinc-400">Variant name</label>
            <input
              name="variantName"
              placeholder="e.g. Default"
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Price (CHF)</label>
            <input
              name="priceCents"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="29.00"
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue="0"
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Image URL</label>
        <input
          name="imageUrl"
          type="url"
          placeholder="https://..."
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create product'}
      </button>
    </form>
  )
}
