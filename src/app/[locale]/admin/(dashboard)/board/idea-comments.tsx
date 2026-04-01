'use client'

import { useState, useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { BoardComment } from '@/actions/admin-board'
import { addComment, deleteComment } from '@/actions/admin-board'

type Props = {
  itemId: string
  comments: BoardComment[]
  currentUserId: string
  onUpdated: (comments: BoardComment[]) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-zinc-950"
      style={{ backgroundColor: `hsl(${hue} 60% 60%)` }}
    >
      {initials}
    </span>
  )
}

export function IdeaComments({ itemId, comments: initial, currentUserId, onUpdated }: Props) {
  const t = useTranslations('admin.board')
  const [comments, setComments] = useState<BoardComment[]>(initial)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    const result = await addComment(itemId, body.trim())
    if (result.ok) {
      // Optimistic: add a temp comment
      const temp: BoardComment = {
        id: `temp-${Date.now()}`,
        item_id: itemId,
        author_id: currentUserId,
        body: body.trim(),
        created_at: new Date().toISOString(),
        author: null,
      }
      const next = [...comments, temp]
      setComments(next)
      onUpdated(next)
      setBody('')
    }
    setSending(false)
  }

  function handleDelete(id: string) {
    const next = comments.filter((c) => c.id !== id)
    setComments(next)
    onUpdated(next)
    startTransition(async () => {
      await deleteComment(id)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-3 border-t border-white/5 pt-3">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-center text-[11px] text-zinc-700 py-2">{t('noComments')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {comments.map((comment) => {
            const name = comment.author?.display_name || t('admin')
            const isOwn = comment.author_id === currentUserId
            return (
              <div key={comment.id} className="group flex gap-2.5">
                <Avatar name={name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-zinc-300">{name}</span>
                    <span className="text-[10px] text-zinc-700" suppressHydrationWarning>{timeAgo(comment.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto hidden group-hover:inline text-[10px] text-zinc-700 hover:text-red-400 transition"
                      >
                        {t('deleteComment')}
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-400 break-words">
                    {comment.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('addCommentPlaceholder')}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
        />
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="self-end rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-40"
        >
          {t('send')}
        </button>
      </div>
    </div>
  )
}
