'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStock } from '@/actions/admin-products'

type Props = { variantId: string; currentQuantity: number }

export function ProductStockForm({ variantId, currentQuantity }: Props) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(currentQuantity)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await updateStock(variantId, quantity)
    setLoading(false)
    if (result.ok) router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Update'}
      </button>
    </form>
  )
}
