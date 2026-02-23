'use client'

import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

type Tag = {
  id: string
  name: string
  slug: string
}

type TagFilterProps = {
  tags: Tag[]
  selectedTag?: string
}

// How many tags to show inline before collapsing into "More"
const VISIBLE_COUNT = 8

export function TagFilter({ tags, selectedTag }: TagFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  function handleTagClick(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!slug) {
      params.delete('tag')
    } else {
      params.set('tag', slug)
    }
    router.push(`?${params.toString()}`, { scroll: false })
    setOpen(false)
    setSearch('')
  }

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  if (tags.length === 0) return null

  const visibleTags = tags.slice(0, VISIBLE_COUNT)
  const hiddenTags = tags.slice(VISIBLE_COUNT)
  const remainingCount = hiddenTags.length

  // Selected tag might be in the hidden list — always show it in the visible row
  const selectedInHidden = selectedTag && hiddenTags.some((t) => t.slug === selectedTag)
  const selectedTagObj = selectedInHidden ? tags.find((t) => t.slug === selectedTag) : null

  const filteredHidden = search.trim()
    ? hiddenTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : hiddenTags

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        {/* All Products */}
        <button
          onClick={() => handleTagClick(null)}
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            !selectedTag
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
          }`}
        >
          All Products
        </button>

        {/* Visible tags */}
        {visibleTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.slug)}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedTag === tag.slug
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {tag.name}
          </button>
        ))}

        {/* If selected tag is in the hidden list, show it as an active pill */}
        {selectedTagObj && (
          <button
            onClick={() => handleTagClick(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-medium text-zinc-950 shadow-lg shadow-amber-500/20 transition-all"
          >
            {selectedTagObj.name}
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* More filters button */}
        {remainingCount > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                open || selectedInHidden
                  ? 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {selectedInHidden ? 'Filter active' : `+${remainingCount} more`}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
                {/* Search input */}
                <div className="border-b border-zinc-800 p-2">
                  <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tags..."
                      className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none"
                    />
                    {search && (
                      <button onClick={() => setSearch('')}>
                        <X className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tag list */}
                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredHidden.length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-600">No tags found</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 p-1">
                      {filteredHidden.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.slug)}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            selectedTag === tag.slug
                              ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/30'
                              : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
