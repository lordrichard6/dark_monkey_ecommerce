'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct } from '@/actions/admin-products'

type Props = {
  productId: string
  description: string | null
}

export function ProductDescriptionField({ productId, description }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)
    const result = await updateProduct(productId, { description: value.trim() || null })
    setLoading(false)
    setEditing(false)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-zinc-400">Description</h3>
      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setValue(description ?? ''); setError(null) }}
              disabled={loading}
              className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="mt-2 cursor-pointer rounded px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800/80"
          title="Click to edit"
        >
          {description || <span className="italic text-zinc-500">No description. Click to add.</span>}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
