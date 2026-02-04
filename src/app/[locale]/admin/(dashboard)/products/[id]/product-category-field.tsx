'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct } from '@/actions/admin-products'

type Category = { id: string; name: string }

type Props = {
  productId: string
  categoryId: string | null
  categories: Category[]
}

export function ProductCategoryField({
  productId,
  categoryId,
  categories,
}: Props) {
  const router = useRouter()
  const [value, setValue] = useState(categoryId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(newValue: string) {
    setValue(newValue)
    setLoading(true)
    setError(null)
    const result = await updateProduct(productId, {
      category_id: newValue || null,
    })
    setLoading(false)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error)
      setValue(categoryId ?? '')
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-zinc-400">Type (Category)</label>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="mt-1 block w-full max-w-xs rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
      >
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
