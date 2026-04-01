'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { BoardItem, AdminProfile, BoardItemStatus, BoardVote } from '@/actions/admin-board'
import { castVote, convertIdeaToTask } from '@/actions/admin-board'
import { IdeaComments } from './idea-comments'

type Props = {
  item: BoardItem
  admins: AdminProfile[]
  currentUserId: string
  onStatusChange: (id: string, status: BoardItemStatus) => void
  onEdit: (item: BoardItem) => void
  onDelete: (id: string) => void
  onItemUpdated: (item: BoardItem) => void
  isRecentlyAdded?: boolean
  statusAnim?: 'to_progress' | 'to_done' | null
}

const PRIORITY_STYLES = {
  high:   { badge: 'bg-red-500/10 text-red-400 ring-red-500/20',    dot: 'bg-red-400' },
  medium: { badge: 'bg-blue-500/10 text-blue-400 ring-blue-500/20', dot: 'bg-blue-400' },
  low:    { badge: 'bg-zinc-500/10 text-zinc-500 ring-zinc-500/20', dot: 'bg-zinc-600' },
}

const TASK_STATUS_ACTIONS: Record<string, { nextStatus: BoardItemStatus; translationKey: string; color: string }> = {
  open:        { nextStatus: 'in_progress', translationKey: 'start',    color: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
  in_progress: { nextStatus: 'done',        translationKey: 'markDone', color: 'bg-green-500/10 text-green-400 hover:bg-green-500/20' },
  done:        { nextStatus: 'open',        translationKey: 'reopen',   color: 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20' },
}

const IDEA_STATUS_COLORS: Record<string, string> = {
  open:      'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  validated: 'bg-green-500/10 text-green-400 ring-green-500/20',
  discarded: 'bg-red-500/10 text-red-400 ring-red-500/20',
  archived:  'bg-zinc-500/10 text-zinc-500 ring-zinc-500/15',
}

function displayName(profile: { display_name: string | null } | null, fallback: string) {
  if (!profile) return fallback
  return profile.display_name || fallback
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  const cls = size === 'xs' ? 'h-4 w-4 text-[8px]' : 'h-5 w-5 text-[9px]'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-zinc-950 ${cls}`}
      style={{ backgroundColor: `hsl(${hue} 60% 60%)` }}
    >
      {initials}
    </span>
  )
}

export function BoardItemCard({ item, currentUserId, onStatusChange, onEdit, onDelete, onItemUpdated, isRecentlyAdded, statusAnim }: Props) {
  const t = useTranslations('admin.board')
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [votes, setVotes] = useState<BoardVote[]>(item.votes)
  const [converting, setConverting] = useState(false)
  const [, startTransition] = useTransition()

  const myVote = votes.find((v) => v.user_id === currentUserId)?.vote ?? null
  const upCount = votes.filter((v) => v.vote === 'up').length
  const downCount = votes.filter((v) => v.vote === 'down').length
  const commentCount = item.comments.length
  const isDone = item.status === 'done'
  const isValidated = item.status === 'validated'
  const isDiscarded = item.status === 'discarded'
  const isArchived = item.status === 'archived'
  const adminFallback = t('admin')

  function handleVote(vote: 'up' | 'down') {
    const newVote = myVote === vote ? null : vote
    // Optimistic update
    setVotes((prev) => {
      const without = prev.filter((v) => v.user_id !== currentUserId)
      if (newVote === null) return without
      return [...without, { item_id: item.id, user_id: currentUserId, vote: newVote }]
    })
    startTransition(async () => {
      await castVote(item.id, newVote)
    })
  }

  async function handleConvertToTask() {
    setConverting(true)
    const result = await convertIdeaToTask(item.id)
    setConverting(false)
    if (result.ok) router.refresh()
  }

  // Task card
  if (item.type === 'task') {
    const priority = PRIORITY_STYLES[item.priority]
    const action = TASK_STATUS_ACTIONS[item.status]

    const animStyle: React.CSSProperties = isRecentlyAdded
      ? { animation: 'task-drop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }
      : statusAnim === 'to_progress'
      ? { animation: 'task-activate 0.75s ease-out both' }
      : statusAnim === 'to_done'
      ? { animation: 'task-complete 0.75s ease-out both' }
      : {}

    return (
      <div style={animStyle} className={`group flex flex-col gap-3 rounded-xl border bg-zinc-900/60 p-4 transition hover:border-white/10 ${isDone ? 'border-green-500/10 opacity-70' : 'border-white/5'}`}>
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${priority.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
            {t(item.priority as 'high' | 'medium' | 'low')}
          </span>
          <CardActions item={item} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>

        <p className={`text-sm font-semibold leading-snug ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
          {item.title}
        </p>
        {item.description && <p className="text-xs leading-relaxed text-zinc-500 line-clamp-3">{item.description}</p>}
        {item.url && <UrlChip url={item.url} />}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
              <Avatar name={displayName(item.creator, adminFallback)} size="xs" />
              <span>{displayName(item.creator, adminFallback)}</span>
              <span className="text-zinc-700">·</span>
              <span suppressHydrationWarning>{timeAgo(item.created_at)}</span>
            </div>
            {item.assignee && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <svg className="h-3 w-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span>{displayName(item.assignee, adminFallback)}</span>
              </div>
            )}
            {(isDone || isValidated) && item.completer && (
              <div className="flex items-center gap-1.5 text-[11px] text-green-600">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('doneBy', { name: displayName(item.completer, adminFallback) })}</span>
              </div>
            )}
          </div>
          {action && (
            <button
              onClick={() => onStatusChange(item.id, action.nextStatus)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${action.color}`}
            >
              {t(action.translationKey as 'start' | 'markDone' | 'reopen')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Idea card — archived: compact grayscale
  if (isArchived) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-2.5 opacity-50 transition hover:opacity-70">
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-zinc-500 line-through">{item.title}</p>
          <p className="mt-0.5 text-[10px] text-zinc-700" suppressHydrationWarning>{timeAgo(item.created_at)}</p>
        </div>
        <button
          onClick={() => onStatusChange(item.id, 'open')}
          className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-600 transition hover:bg-white/5 hover:text-zinc-400"
          title={t('unarchive')}
        >
          {t('unarchive')}
        </button>
        <CardActions item={item} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} onEdit={onEdit} onDelete={onDelete} />
      </div>
    )
  }

  // Idea card — active (open / validated / discarded)
  const ideaStatusColor = IDEA_STATUS_COLORS[item.status] ?? IDEA_STATUS_COLORS.open

  const ideaBg = isDiscarded
    ? 'bg-gradient-to-br from-red-950/20 to-zinc-900/80'
    : isValidated
    ? 'bg-gradient-to-br from-green-950/20 to-zinc-900/80'
    : 'bg-gradient-to-br from-purple-950/30 to-zinc-900/80'

  const ideaBorder = isDiscarded
    ? 'border-red-500/15 opacity-60'
    : isValidated
    ? 'border-green-500/20 hover:border-green-500/30'
    : 'border-purple-500/20 hover:border-purple-500/35'

  const ideaAccent = isDiscarded
    ? 'border-l-red-500/40'
    : isValidated
    ? 'border-l-green-500/40'
    : 'border-l-purple-500/50'

  return (
    <div
      style={isRecentlyAdded ? { animation: 'task-drop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both' } : undefined}
      className={`relative flex flex-col gap-3 rounded-2xl border border-l-2 p-4 transition overflow-hidden ${ideaBg} ${ideaBorder} ${ideaAccent}`}
    >

      {/* Decorative background glow */}
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-20 ${
        isDiscarded ? 'bg-red-500' : isValidated ? 'bg-green-500' : 'bg-purple-500'
      }`} />

      {/* Top row: badges + actions */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Idea icon badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
            isDiscarded ? 'bg-red-500/10 text-red-400 ring-red-500/20'
            : isValidated ? 'bg-green-500/10 text-green-400 ring-green-500/20'
            : 'bg-purple-500/15 text-purple-300 ring-purple-500/25'
          }`}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            {t('idea')}
          </span>
          {item.status !== 'open' && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${ideaStatusColor}`}>
              {t(item.status as 'validated' | 'discarded')}
            </span>
          )}
        </div>
        <CardActions item={item} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Title */}
      <p className={`relative text-sm font-semibold leading-snug ${isDiscarded ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
        {item.title}
      </p>

      {/* Description */}
      {item.description && (
        <p className="relative text-xs leading-relaxed text-zinc-400/80">{item.description}</p>
      )}

      {item.url && <UrlChip url={item.url} />}

      {/* Vote bar */}
      <div className="relative flex items-center gap-2 pt-0.5">
        <VoteButton
          type="up"
          count={upCount}
          active={myVote === 'up'}
          title={t('upvote')}
          onClick={() => handleVote('up')}
        />
        <VoteButton
          type="down"
          count={downCount}
          active={myVote === 'down'}
          title={t('downvote')}
          onClick={() => handleVote('down')}
        />

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((s) => !s)}
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
            showComments ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500 hover:bg-purple-500/10 hover:text-purple-300'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          {showComments ? t('hideComments') : (commentCount > 0 ? (commentCount === 1 ? t('oneComment') : t('comments', { count: commentCount })) : t('showComments'))}
        </button>
      </div>

      {/* Divider */}
      <div className={`h-px w-full ${isDiscarded ? 'bg-red-500/10' : isValidated ? 'bg-green-500/10' : 'bg-purple-500/10'}`} />

      {/* Idea status actions */}
      {item.status === 'open' && (
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange(item.id, 'validated')}
            className="flex-1 rounded-xl bg-green-500/10 px-3 py-1.5 text-[11px] font-bold text-green-400 transition hover:bg-green-500/20"
          >
            ✓ {t('validate')}
          </button>
          <button
            onClick={() => onStatusChange(item.id, 'discarded')}
            className="flex-1 rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-500/20"
          >
            ✕ {t('discard')}
          </button>
        </div>
      )}

      {(item.status === 'validated' || item.status === 'discarded') && (
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange(item.id, 'open')}
            className="rounded-xl bg-zinc-500/10 px-3 py-1.5 text-[11px] font-bold text-zinc-400 transition hover:bg-zinc-500/20"
          >
            {t('reopen')}
          </button>
          {isValidated && (
            <button
              onClick={handleConvertToTask}
              disabled={converting}
              className="flex-1 rounded-xl bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              {converting ? '…' : `→ ${t('convertToTask')}`}
            </button>
          )}
        </div>
      )}

      {/* Creator + validated-by + Archive button */}
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
        <Avatar name={displayName(item.creator, adminFallback)} size="xs" />
        <span>{displayName(item.creator, adminFallback)}</span>
        <span className="text-zinc-700">·</span>
        <span suppressHydrationWarning>{timeAgo(item.created_at)}</span>
        {isValidated && item.completer && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-green-600">{t('validatedBy', { name: displayName(item.completer, adminFallback) })}</span>
          </>
        )}
        <button
          onClick={() => onStatusChange(item.id, 'archived')}
          className="ml-auto rounded-lg px-2 py-0.5 text-[10px] font-semibold text-zinc-700 transition hover:bg-white/5 hover:text-zinc-500"
          title={t('archive')}
        >
          {t('archive')}
        </button>
      </div>

      {/* Comment thread */}
      {showComments && (
        <IdeaComments
          itemId={item.id}
          comments={item.comments}
          currentUserId={currentUserId}
          onUpdated={(comments) => onItemUpdated({ ...item, comments })}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VoteButton({ type, count, active, title, onClick }: {
  type: 'up' | 'down'
  count: number
  active: boolean
  title: string
  onClick: () => void
}) {
  const upStyle = active ? 'bg-green-500/20 text-green-400 ring-green-500/30' : 'bg-white/5 text-zinc-500 hover:bg-green-500/10 hover:text-green-400'
  const downStyle = active ? 'bg-red-500/20 text-red-400 ring-red-500/30' : 'bg-white/5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400'
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ring-1 ring-transparent transition ${type === 'up' ? upStyle : downStyle}`}
    >
      {type === 'up' ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.861-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
        </svg>
      )}
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

function UrlChip({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 truncate rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-amber-500/20 hover:text-amber-400 hover:bg-amber-500/5"
    >
      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
      <span className="truncate max-w-[200px]">{url.replace(/^https?:\/\/(www\.)?/, '')}</span>
      <svg className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    </a>
  )
}

function CardActions({ item, confirmDelete, setConfirmDelete, onEdit, onDelete }: {
  item: BoardItem
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  onEdit: (item: BoardItem) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('admin.board')
  return (
    <div className="ml-auto flex items-center gap-1 shrink-0">
      <button
        onClick={() => onEdit(item)}
        className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300"
        title={t('editItem')}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
      </button>
      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <button onClick={() => onDelete(item.id)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-500/10">{t('confirmDelete')}</button>
          <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-white/5">{t('cancelDelete')}</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      )}
    </div>
  )
}
