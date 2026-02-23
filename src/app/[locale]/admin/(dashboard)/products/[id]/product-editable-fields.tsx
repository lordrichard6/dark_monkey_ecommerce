'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct } from '@/actions/admin-products'

type Props = {
  productId: string
  name: string
  slug: string
  nameAction?: React.ReactNode
}

export function ProductEditableFields({ productId, name, slug, nameAction }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<'name' | 'slug' | null>(null)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(field: 'name' | 'slug') {
    setEditing(field)
    setValue(field === 'name' ? name : slug)
    setError(null)
  }

  async function handleSave() {
    if (!editing) return
    setLoading(true)
    setError(null)
    const updates: { name?: string; slug?: string } = {}
    if (editing === 'name') updates.name = value.trim()
    else if (editing === 'slug') updates.slug = value.trim()

    const result = await updateProduct(productId, updates)
    setLoading(false)
    setEditing(null)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  function handleCancel() {
    setEditing(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label className="text-sm font-medium text-zinc-400">Name</label>
          {editing === 'name' ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
                autoFocus
              />
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
                onClick={handleCancel}
                disabled={loading}
                className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p
              onClick={() => startEdit('name')}
              className="mt-1 cursor-pointer rounded px-2 py-1 text-xl font-bold text-zinc-50 hover:bg-zinc-800/80"
              title="Click to edit"
            >
              {name}
            </p>
          )}
        </div>
        {nameAction}
      </div>

      {/* Slug */}
      <div>
        <label className="text-sm font-medium text-zinc-400">Slug (URL)</label>
        {editing === 'slug' ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
            />
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
              onClick={handleCancel}
              disabled={loading}
              className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p
            onClick={() => startEdit('slug')}
            className="mt-1 cursor-pointer rounded px-2 py-1 font-mono text-sm text-zinc-400 hover:bg-zinc-800/80"
            title="Click to edit"
          >
            {slug}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
