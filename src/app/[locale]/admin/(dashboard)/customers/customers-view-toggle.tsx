'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { useTransition } from 'react'

type Props = {
  view: 'table' | 'grid'
}

export function CustomersViewToggle({ view }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function setView(v: 'table' | 'grid') {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : undefined
    )
    if (v === 'table') params.delete('view')
    else params.set('view', v)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div
      className={`flex items-center rounded-lg border border-zinc-700 bg-zinc-800/60 p-0.5 transition-opacity ${isPending ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => setView('table')}
        title="Table view"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          view === 'table' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setView('grid')}
        title="Grid view"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          view === 'grid' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
