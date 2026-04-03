'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductExclusive } from '@/actions/admin-products'
import { toast } from 'sonner'

type User = { id: string; email: string; displayName: string | null }

type Props = {
  productId: string
  initialIsExclusive: boolean
  initialExclusiveUserId: string | null
  users: User[]
}

export function ProductToggleExclusive({
  productId,
  initialIsExclusive,
  initialExclusiveUserId,
  users,
}: Props) {
  const router = useRouter()
  const [exclusive, setExclusive] = useState(initialIsExclusive)
  const [selectedUserId, setSelectedUserId] = useState<string>(initialExclusiveUserId ?? '')
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const next = !exclusive
    setExclusive(next) // optimistic
    if (!next) {
      // Turning off — clear immediately
      setLoading(true)
      const result = await updateProductExclusive(productId, false, null)
      setLoading(false)
      if (!result.ok) {
        setExclusive(true)
        toast.error(result.error ?? 'Failed to update')
      } else {
        toast.success('Product is no longer exclusive')
        router.refresh()
      }
    }
    // If turning on, just show the dropdown — save happens on user selection
  }

  async function handleUserSelect(userId: string) {
    setSelectedUserId(userId)
    if (!userId) return
    setLoading(true)
    const result = await updateProductExclusive(productId, true, userId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error ?? 'Failed to update')
    } else {
      const u = users.find((u) => u.id === userId)
      toast.success(`Product is now exclusive to ${u?.displayName ?? u?.email ?? userId}`)
      router.refresh()
    }
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2.5">
      {/* Toggle */}
      <button
        onClick={handleToggle}
        disabled={loading}
        title={exclusive ? 'Click to remove exclusivity' : 'Click to make exclusive to a user'}
        className="inline-flex cursor-pointer items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* Track */}
        <span
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
            exclusive ? 'bg-rose-500' : 'bg-zinc-700'
          }`}
        >
          {/* Thumb */}
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              exclusive ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </span>
        <span
          className={`text-xs font-medium transition-colors ${exclusive ? 'text-rose-400' : 'text-zinc-500'}`}
        >
          {loading ? 'Saving…' : 'Exclusive'}
        </span>
      </button>

      {/* User dropdown — only visible when exclusive is on */}
      {exclusive && (
        <select
          value={selectedUserId}
          onChange={(e) => handleUserSelect(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200 transition focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 disabled:opacity-50"
        >
          <option value="">— Select user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName ? `${u.displayName} (${u.email})` : u.email}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
