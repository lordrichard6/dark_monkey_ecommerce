'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'

export function SearchBar() {
  const router = useRouter()
  const t = useTranslations('search')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      })
    }
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder') || 'Search products...'}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          disabled={isPending}
        />

        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        {/* Clear button (only show when there's text) */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="absolute left-0 top-full mt-2 text-xs text-zinc-500">
          Searching...
        </div>
      )}
    </form>
  )
}
