'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/actions/admin-products'

type Category = { id: string; name: string; slug: string }

type Props = { categories: Category[] }

export function CreateProductForm({ categories }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      categoryId: formData.get('categoryId') as string || undefined,
      isCustomizable: formData.get('isCustomizable') === 'on',
      variantName: formData.get('variantName') as string,
      priceCents: Math.round(parseFloat(formData.get('priceCents') as string) * 100),
      stock: parseInt(formData.get('stock') as string, 10) || 0,
      imageUrl: formData.get('imageUrl') as string || undefined,
    })
    setLoading(false)
    if (result.ok && result.productId) {
      router.push(`/admin/products/${result.productId}`)
    } else {
      setError('error' in result ? result.error : 'Failed to create')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
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
      <div>
        <label className="block text-sm font-medium text-zinc-300">Description</label>
        <textarea
          name="description"
          rows={3}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Category</label>
        <select
          name="categoryId"
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
