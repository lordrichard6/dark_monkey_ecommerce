'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { getProductSuggestions } from '@/actions/search-suggestions'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'

export function SearchBar() {
  const router = useRouter()
  const t = useTranslations('search')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const trendingSearches = [
    t('trendingHoodies') || 'Premium Hoodies',
    t('trendingArt') || 'Exclusive Art',
    t('trendingAccessories') || 'Luxury Accessories'
  ]

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const results = await getProductSuggestions(query)
        setSuggestions(results)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        setShowSuggestions(false)
      })
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
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

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl"
        >
          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Products
              </span>
              {suggestions.map((p) => (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                    {p.imageUrl && (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <span className="truncate text-sm text-zinc-200">{p.name}</span>
                </Link>
              ))}
            </div>
          ) : query.length < 2 ? (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Trending
              </span>
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term)
                    router.push(`/search?q=${encodeURIComponent(term)}`)
                    setShowSuggestions(false)
                  }}
                  className="flex items-center gap-3 rounded-lg p-3 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Search className="h-3.5 w-3.5 text-zinc-500" />
                  {term}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-zinc-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="absolute left-0 top-full mt-2 text-xs text-zinc-500">
          Searching...
        </div>
      )}
    </form>
  )
}
