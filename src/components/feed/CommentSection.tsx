'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { enUS } from 'date-fns/locale/en-US'
import { pt } from 'date-fns/locale/pt'
import { de } from 'date-fns/locale/de'
import { fr } from 'date-fns/locale/fr'
import { it } from 'date-fns/locale/it'
import type { Locale } from 'date-fns'
import { addComment, deleteComment } from '@/actions/feed'
import type { FeedComment } from '@/actions/feed'

const DATE_LOCALES: Record<string, Locale> = { en: enUS, pt, de, fr, it }

interface CommentSectionProps {
  postId: string
  initialComments: FeedComment[]
  currentUserId: string | null
  isAdmin: boolean
}

function Avatar({ displayName }: { displayName: string | null }) {
  const initial = displayName?.trim().charAt(0).toUpperCase() ?? '?'
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300 select-none">
      {initial}
    </div>
  )
}

export default function CommentSection({
  postId,
  initialComments,
  currentUserId,
  isAdmin,
}: CommentSectionProps) {
  const t = useTranslations('feed')
  const locale = useLocale()

  const [comments, setComments] = useState<FeedComment[]>(initialComments)
  const [body, setBody] = useState('')
  const [submitPending, startSubmitTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charsLeft = 2000 - body.length

  function handleDelete(commentId: string) {
    // Optimistic removal
    setDeletingId(commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))

    deleteComment(commentId).then((result) => {
      if (!result.ok) {
        // Revert — re-fetch would be ideal; for now just restore from initial
        setComments((prev) => {
          const exists = prev.find((c) => c.id === commentId)
          if (exists) return prev
          const original = initialComments.find((c) => c.id === commentId)
          return original
            ? [...prev, original].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
            : prev
        })
      }
      setDeletingId(null)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || trimmed.length > 2000) return

    startSubmitTransition(async () => {
      const result = await addComment(postId, trimmed)
      if (result.ok && result.comment) {
        setComments((prev) => [...prev, result.comment!])
        setBody('')
        textareaRef.current?.focus()
      }
    })
  }

  return (
    <div className="border-t border-zinc-800 pt-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">{t('beFirstToComment')}</p>
      ) : (
        <ul className="space-y-3 pb-4">
          {comments.map((comment) => {
            const displayName = comment.author?.display_name ?? t('anonymous')
            const canDelete =
              isAdmin || (currentUserId !== null && comment.user_id === currentUserId)
            const isBeingDeleted = deletingId === comment.id

            return (
              <li
                key={comment.id}
                className={`flex gap-3 transition-opacity ${isBeingDeleted ? 'opacity-40' : 'opacity-100'}`}
              >
                <Avatar displayName={displayName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-200">{displayName}</span>
                    <span className="text-xs text-zinc-500" suppressHydrationWarning>
                      {formatDistanceToNow(new Date(comment.created_at), {
                        locale: DATE_LOCALES[locale] ?? enUS,
                        addSuffix: true,
                      })}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isBeingDeleted}
                        className="ml-auto text-xs text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-300 break-words">{comment.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Add comment */}
      {currentUserId === null ? (
        <p className="text-sm text-zinc-500">
          <Link
            href="/login"
            className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
          >
            {t('login')}
          </Link>{' '}
          {t('toComment')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('addComment')}
            maxLength={2000}
            rows={2}
            disabled={submitPending}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50 transition"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${charsLeft < 100 ? 'text-amber-400' : 'text-zinc-600'}`}>
              {t('charsLeft', { count: charsLeft })}
            </span>
            <button
              type="submit"
              disabled={submitPending || body.trim().length === 0}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitPending ? t('posting') : t('submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
