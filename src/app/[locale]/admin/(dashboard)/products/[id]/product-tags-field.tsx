'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateProductTags } from '@/actions/admin-products'
import { Tag as TagIcon, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Tag = { id: string; name: string }

type Props = {
  productId: string
  initialTagIds: string[]
  availableTags: Tag[]
}

export function ProductTagsField({ productId, initialTagIds, availableTags }: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialTagIds)
  const [loading, setLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')

  async function handleToggleTag(tagId: string) {
    const isSelected = selectedIds.includes(tagId)
    const previousIds = selectedIds // capture before mutation
    const newIds = isSelected ? selectedIds.filter((id) => id !== tagId) : [...selectedIds, tagId]

    setSelectedIds(newIds)
    setLoading(true)

    try {
      const result = await updateProductTags(productId, newIds)
      if (result.ok) {
        router.refresh()
      } else {
        toast.error(result.error)
        setSelectedIds(previousIds) // revert to pre-optimistic state
      }
    } catch (err) {
      toast.error(t('products.tags'))
      setSelectedIds(previousIds) // revert to pre-optimistic state
    } finally {
      setLoading(false)
    }
  }

  const selectedTags = availableTags.filter((t) => selectedIds.includes(t.id))
  const unselectedTags = availableTags
    .filter((t) => !selectedIds.includes(t.id))
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <TagIcon className="h-4 w-4" />
        Tags
      </label>

      <div className="flex flex-wrap gap-2 items-center">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
          >
            {tag.name}
            <button
              onClick={() => handleToggleTag(tag.id)}
              disabled={loading}
              className="hover:text-emerald-300 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors border border-zinc-700 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            {t('products.addTag')}
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setIsDropdownOpen(false)
                  setSearch('')
                }}
              />
              <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl ring-1 ring-black ring-opacity-5">
                {/* Search input */}
                <div className="p-2 border-b border-zinc-800">
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="max-h-52 overflow-auto p-1">
                  {unselectedTags.length > 0 ? (
                    unselectedTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          handleToggleTag(tag.id)
                          setIsDropdownOpen(false)
                          setSearch('')
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-zinc-500 italic">
                      {search ? `No tags matching "${search}"` : t('products.noMoreTags')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
