'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useCallback, useTransition } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

type Props = {
  search?: string
  tier?: string
  emailStatus?: string
}

export function CustomersFilterBar({ search: initialSearch, tier, emailStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : undefined
      )
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      params.delete('page')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [pathname, router]
  )

  const handleSearch = (value: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ search: value }), 380)
  }

  const hasFilters = initialSearch || tier || emailStatus

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search name or email…"
          defaultValue={initialSearch ?? ''}
          onChange={(e) => handleSearch(e.target.value)}
          className={`h-9 w-60 rounded-lg border bg-zinc-800/60 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors ${
            isPending ? 'border-amber-500/40' : 'border-zinc-700 focus:border-amber-500/50'
          }`}
        />
      </div>

      {/* Tier filter */}
      <div className="relative">
        <select
          value={tier ?? ''}
          onChange={(e) => updateParams({ tier: e.target.value })}
          className="h-9 appearance-none rounded-lg border border-zinc-700 bg-zinc-800/60 pl-3 pr-8 text-sm text-zinc-300 focus:border-amber-500/50 focus:outline-none transition-colors"
        >
          <option value="">All tiers</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
      </div>

      {/* Email status filter */}
      <div className="relative">
        <select
          value={emailStatus ?? ''}
          onChange={(e) => updateParams({ emailStatus: e.target.value })}
          className="h-9 appearance-none rounded-lg border border-zinc-700 bg-zinc-800/60 pl-3 pr-8 text-sm text-zinc-300 focus:border-amber-500/50 focus:outline-none transition-colors"
        >
          <option value="">All email statuses</option>
          <option value="verified">Verified only</option>
          <option value="unverified">Unverified only</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => startTransition(() => router.push(pathname))}
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}

      {isPending && <span className="text-xs text-zinc-600">Loading…</span>}
    </div>
  )
}
