'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  updateCustomRequestStatus,
  resendCustomProductReadyNotification,
} from '@/actions/custom-products'
import type { CustomProductRequest } from '@/lib/custom-products-config'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react'

type Request = CustomProductRequest & { user_email?: string; user_name?: string }

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  in_review: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-400',
}

/** "in_review" → "In Review", "tote_bag" → "Tote Bag" (#1, #3) */
function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      title="Copy email"
      className="ml-1 rounded p-0.5 text-zinc-500 transition hover:text-zinc-300"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function RequestRow({ request }: { request: Request }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [productId, setProductId] = useState(request.product_id ?? '')
  // New note field — starts empty; existing note shown read-only (#13)
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const toggle = () => {
    if (expanded) setFeedback(null) // reset stale feedback on collapse (#4)
    setExpanded((p) => !p)
  }

  const handleUpdate = async (status: 'pending' | 'in_review' | 'ready' | 'rejected') => {
    setLoading(true)
    setFeedback(null)
    const result = await updateCustomRequestStatus({
      requestId: request.id,
      status,
      productId: status === 'ready' ? productId : undefined,
      adminNote: newNote.trim() || undefined, // only send if non-empty (#13)
    })
    setLoading(false)
    setFeedback({ ok: result.ok, msg: result.ok ? 'Updated!' : (result.error ?? 'Error') })
    if (result.ok) {
      setNewNote('')
      router.refresh()
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setFeedback(null)
    const result = await resendCustomProductReadyNotification(request.id)
    setLoading(false)
    setFeedback({
      ok: result.ok,
      msg: result.ok ? 'Email resent!' : (result.error ?? 'Error'),
    })
  }

  const isPending = request.status === 'pending'
  const isInReview = request.status === 'in_review'
  const isReady = request.status === 'ready'
  const isRejected = request.status === 'rejected'

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60">
      {/* Row header */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          {request.images[0] && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
              <Image src={request.images[0]} alt="Design" fill className="object-cover" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">
                {request.user_name ?? request.user_email ?? request.user_id.slice(0, 8)}
              </span>
              <span className="text-zinc-600">·</span>
              {/* #3: formatted with fmt() — no more "Tote_bag" */}
              <span className="text-sm text-zinc-400">{fmt(request.article_type)}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-sm text-zinc-400">{fmt(request.art_style)}</span>
              {/* #1: formatted status badge — no more "In_review" */}
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status]}`}
              >
                {fmt(request.status)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{request.description}</p>
            <p className="mt-0.5 text-xs text-zinc-600">
              {new Date(request.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' · '}
              {request.images.length} image{request.images.length !== 1 ? 's' : ''}
              {' · '}
              {request.change_count} change{request.change_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          className="shrink-0 rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Images */}
          <div className="flex flex-wrap gap-2">
            {request.images.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative h-24 w-24 overflow-hidden rounded-lg border border-white/10 hover:border-amber-500/40"
              >
                <Image src={url} alt={`Design ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Eye className="h-4 w-4 text-white" />
                </div>
              </a>
            ))}
          </div>

          {/* Description */}
          <div className="rounded-lg border border-white/5 bg-zinc-800/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              User Description
            </p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* User email with copy button (#12) */}
          {request.user_email && (
            <p className="flex items-center text-xs text-zinc-500">
              Email:
              <span className="ml-1 text-zinc-300">{request.user_email}</span>
              <CopyEmailButton email={request.user_email} />
            </p>
          )}

          {/* ── Admin Actions — always visible (#2) ── */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-800/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Admin Actions
            </p>

            {/* Existing admin note displayed read-only (#13) */}
            {request.admin_note && (
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Current Note
                </p>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap">{request.admin_note}</p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  Updated{' '}
                  {new Date(request.updated_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* New note textarea — only overwrites if non-empty (#13) */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">
                {request.admin_note
                  ? 'Update note (leave blank to keep current)'
                  : 'Note to user (optional)'}
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                placeholder="Any message to show the user..."
                className="block w-full resize-none rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Product ID — only needed when marking ready */}
            {(isPending || isInReview) && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">
                  Product ID <span className="text-zinc-600">(required to mark Ready)</span>
                </label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="UUID from products table"
                  className="block w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
            )}

            {feedback && (
              <p className={`text-xs ${feedback.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback.msg}
              </p>
            )}

            {/* ── Status-specific buttons (#2) ── */}
            <div className="flex flex-wrap gap-2">
              {/* pending → can mark in_review, ready, reject */}
              {isPending && (
                <>
                  <button
                    onClick={() => handleUpdate('in_review')}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Mark In Review
                  </button>
                  <button
                    onClick={() => handleUpdate('ready')}
                    disabled={loading || !productId.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Mark Ready & Notify
                  </button>
                  <button
                    onClick={() => handleUpdate('rejected')}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </button>
                </>
              )}

              {/* in_review → can go back to pending, mark ready, reject */}
              {isInReview && (
                <>
                  <button
                    onClick={() => handleUpdate('pending')}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Move to Pending
                  </button>
                  <button
                    onClick={() => handleUpdate('ready')}
                    disabled={loading || !productId.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Mark Ready & Notify
                  </button>
                  <button
                    onClick={() => handleUpdate('rejected')}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </button>
                </>
              )}

              {/* ready → resend notification, move back to in_review */}
              {isReady && (
                <>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Resend Notification (#11)
                  </button>
                  <button
                    onClick={() => handleUpdate('in_review')}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Move to In Review
                  </button>
                </>
              )}

              {/* rejected → re-open to pending */}
              {isRejected && (
                <button
                  onClick={() => handleUpdate('pending')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Re-open (Pending)
                </button>
              )}

              {/* Save note button — available when a new note is typed regardless of status */}
              {newNote.trim() && (
                <button
                  onClick={() =>
                    handleUpdate(request.status as 'pending' | 'in_review' | 'ready' | 'rejected')
                  }
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Save Note Only
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CustomRequestsTable({ requests }: { requests: Request[] }) {
  if (!requests.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-12 text-center">
        <p className="text-zinc-500">No requests found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestRow key={r.id} request={r} />
      ))}
    </div>
  )
}
