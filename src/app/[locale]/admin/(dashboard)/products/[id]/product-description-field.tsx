'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct } from '@/actions/admin-products'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

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
    if (result.ok) {
      setEditing(false)
      router.refresh()
    } else {
      setError(result.error) // keep editor open so user can retry
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Description</h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <RichTextEditor value={value} onChange={setValue} minHeight="200px" />
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
              onClick={() => {
                setEditing(false)
                setValue(description ?? '')
                setError(null)
              }}
              disabled={loading}
              className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer rounded px-2 py-1 hover:bg-zinc-800/80"
          title="Click to edit"
        >
          {description ? (
            <div dangerouslySetInnerHTML={{ __html: description }} className="admin-rich-text" />
          ) : (
            <span className="italic text-zinc-500 text-sm">No description. Click to add.</span>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
