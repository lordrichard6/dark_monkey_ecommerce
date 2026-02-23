'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

type Props = { id: string; label?: string }

export function CopyIdButton({ id, label }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label ?? 'ID'}`}
      className="group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
      )}
      <span className={copied ? 'text-emerald-400' : ''}>
        {copied ? 'Copied!' : id.slice(0, 8) + '…'}
      </span>
    </button>
  )
}
