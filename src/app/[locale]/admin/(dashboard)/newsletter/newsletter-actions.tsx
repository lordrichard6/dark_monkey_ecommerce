'use client'

import { useTransition, useState } from 'react'
import { deleteNewsletterSubscriber, getAllSubscriberEmails } from '@/actions/admin-newsletter'
import { Download, Trash2 } from 'lucide-react'

// ─── Export CSV button (used in header) ───────────────────────────────────────
function ExportCsvButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const emails = await getAllSubscriberEmails()
      const csv = ['email', ...emails].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
    >
      <Download className="h-4 w-4" />
      {loading ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}

// ─── Delete button used in table rows ─────────────────────────────────────────
function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (done) return <span className="text-xs text-zinc-600">Removed</span>

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await deleteNewsletterSubscriber(id)
          setDone(true)
        })
      }
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? 'Removing…' : 'Remove'}
    </button>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────
function Row({ id, email, createdAt }: { id: string; email: string; createdAt: string }) {
  return (
    <tr className="group hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-3 font-mono text-sm text-zinc-200">{email}</td>
      <td className="px-4 py-3 text-sm text-zinc-400">
        {new Date(createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3 text-right">
        <DeleteButton id={id} />
      </td>
    </tr>
  )
}

// ─── Mobile card row ──────────────────────────────────────────────────────────
function RowMobile({ id, email, createdAt }: { id: string; email: string; createdAt: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div>
        <p className="font-mono text-sm text-zinc-200">{email}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {new Date(createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
      <DeleteButton id={id} />
    </div>
  )
}

// ─── Compound export ──────────────────────────────────────────────────────────
export function NewsletterActions() {
  return <ExportCsvButton />
}
NewsletterActions.Row = Row
NewsletterActions.RowMobile = RowMobile
