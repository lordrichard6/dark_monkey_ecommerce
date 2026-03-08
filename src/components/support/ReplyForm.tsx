'use client'

import { useState, useTransition } from 'react'
import { SendHorizonal } from 'lucide-react'

type Props = {
  onSubmit: (message: string) => Promise<{ ok: boolean; error?: string }>
  placeholder: string
  label: string
  disabled?: boolean
  disabledMessage?: string
}

export function ReplyForm({ onSubmit, placeholder, label, disabled, disabledMessage }: Props) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isPending) return
    setError(null)

    startTransition(async () => {
      const result = await onSubmit(message.trim())
      if (result.ok) {
        setMessage('')
      } else {
        setError(result.error ?? 'Failed to send reply.')
      }
    })
  }

  if (disabled) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm text-zinc-500">
        {disabledMessage}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        <button
          type="submit"
          disabled={!message.trim() || isPending}
          className="self-end rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizonal className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </button>
      </div>
    </form>
  )
}
