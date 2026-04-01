'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { BoardItem, AdminProfile, BoardItemStatus } from '@/actions/admin-board'
import { updateBoardItemStatus, deleteBoardItem } from '@/actions/admin-board'
import { BoardItemCard } from './board-item-card'
import { CreateEditModal } from './create-edit-modal'

type Props = {
  initialItems: BoardItem[]
  admins: AdminProfile[]
  currentUserId: string
}

type TabType = 'tasks' | 'ideas'

export function BoardClient({ initialItems, admins, currentUserId }: Props) {
  const t = useTranslations('admin.board')
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('tasks')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<BoardItem | null>(null)
  const [items, setItems] = useState<BoardItem[]>(initialItems)
  const [actionError, setActionError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Animation state
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set())
  const [statusAnimMap, setStatusAnimMap] = useState<Map<string, 'to_progress' | 'to_done'>>(new Map())
  const prevIdsRef = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)))

  // Resync local state whenever the server delivers fresh data (after router.refresh())
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Detect newly added items and trigger drop-in animation
  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id))
    const newIds = [...currentIds].filter((id) => !prevIdsRef.current.has(id))
    prevIdsRef.current = currentIds
    if (newIds.length === 0) return
    setRecentlyAddedIds(new Set(newIds))
    const t = setTimeout(() => setRecentlyAddedIds(new Set()), 700)
    return () => clearTimeout(t)
  }, [items])

  const tasks = items.filter((i) => i.type === 'task')
  const ideas = items.filter((i) => i.type === 'idea')
  const activeIdeas = ideas.filter((i) => i.status !== 'archived')
  const archivedIdeas = ideas.filter((i) => i.status === 'archived')

  const TASK_COLUMNS: { key: BoardItemStatus; label: string; dot: string; textColor: string }[] = [
    { key: 'open',        label: t('open'),       dot: 'bg-zinc-500',  textColor: 'text-zinc-400' },
    { key: 'in_progress', label: t('inProgress'), dot: 'bg-amber-400', textColor: 'text-amber-400' },
    { key: 'done',        label: t('done'),        dot: 'bg-green-500', textColor: 'text-green-400' },
  ]

  function handleStatusChange(id: string, status: BoardItemStatus) {
    setActionError(null)

    // Trigger status animation for tasks
    const animType =
      status === 'in_progress' ? 'to_progress' :
      status === 'done'        ? 'to_done'     : null
    if (animType) {
      setStatusAnimMap((prev) => new Map(prev).set(id, animType))
      setTimeout(() => {
        setStatusAnimMap((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      }, 850)
    }

    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, status } : item)
    )
    startTransition(async () => {
      const result = await updateBoardItemStatus(id, status)
      if (!result.ok) {
        setActionError(result.error)
      }
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    setActionError(null)
    setItems((prev) => prev.filter((item) => item.id !== id))
    startTransition(async () => {
      const result = await deleteBoardItem(id)
      if (!result.ok) {
        setActionError(result.error)
      }
      router.refresh()
    })
  }

  function handleItemUpdated(updated: BoardItem) {
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
  }

  function handleItemCreated() {
    router.refresh()
  }

  return (
    <>
      {/* Action error banner */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="shrink-0 text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 md:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">{t('newItem')}</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/5 bg-zinc-900/60 p-1 w-fit">
        {(['tasks', 'ideas'] as TabType[]).map((tabKey) => {
          const count = tabKey === 'tasks'
            ? tasks.filter((i) => i.status !== 'done').length
            : activeIdeas.length
          const label = tabKey === 'tasks' ? t('tasks') : t('ideas')
          return (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                tab === tabKey
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tabKey === 'tasks' ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              )}
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === tabKey ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-zinc-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tasks — 3 swimlane columns */}
      {tab === 'tasks' && (
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_COLUMNS.map((col) => {
            const colItems = tasks.filter((i) => i.status === col.key)
            return (
              <div key={col.key} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${col.textColor}`}>
                    {col.label}
                  </span>
                  <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                    {colItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {colItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/5 px-4 py-8 text-center text-xs text-zinc-700">
                      {t('noItemsInColumn', { status: col.label.toLowerCase() })}
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <BoardItemCard
                        key={item.id}
                        item={item}
                        admins={admins}
                        currentUserId={currentUserId}
                        onStatusChange={handleStatusChange}
                        onEdit={(i) => { setEditItem(i); setModalOpen(true) }}
                        onDelete={handleDelete}
                        onItemUpdated={handleItemUpdated}
                        isRecentlyAdded={recentlyAddedIds.has(item.id)}
                        statusAnim={statusAnimMap.get(item.id) ?? null}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ideas — active + archived side panel */}
      {tab === 'ideas' && (
        <div className="flex gap-6 items-start">

          {/* Active ideas — masonry */}
          <div className="flex-1 min-w-0">
            {activeIdeas.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 py-24 text-center">
                <svg className="mb-4 h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <p className="text-sm font-medium text-zinc-600">{t('noIdeasYet')}</p>
                <p className="mt-1 text-xs text-zinc-700">{t('noIdeasSubtitle')}</p>
                <button
                  onClick={() => { setEditItem(null); setModalOpen(true) }}
                  className="mt-6 rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/10"
                >
                  {t('addIdea')}
                </button>
              </div>
            ) : (
              <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
                {activeIdeas.map((item) => (
                  <div key={item.id} className="mb-4 break-inside-avoid">
                    <BoardItemCard
                      item={item}
                      admins={admins}
                      currentUserId={currentUserId}
                      onStatusChange={handleStatusChange}
                      onEdit={(i) => { setEditItem(i); setModalOpen(true) }}
                      onDelete={handleDelete}
                      onItemUpdated={handleItemUpdated}
                      isRecentlyAdded={recentlyAddedIds.has(item.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archived ideas — right panel */}
          <div className="w-64 shrink-0 xl:w-72">
            <div className="flex items-center gap-2 mb-3 px-1">
              <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                {t('archivedIdeas')}
              </span>
              <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                {archivedIdeas.length}
              </span>
            </div>

            {archivedIdeas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/5 px-4 py-6 text-center text-xs text-zinc-700">
                {t('noArchivedIdeas')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {archivedIdeas.map((item) => (
                  <BoardItemCard
                    key={item.id}
                    item={item}
                    admins={admins}
                    currentUserId={currentUserId}
                    onStatusChange={handleStatusChange}
                    onEdit={(i) => { setEditItem(i); setModalOpen(true) }}
                    onDelete={handleDelete}
                    onItemUpdated={handleItemUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <CreateEditModal
          item={editItem}
          admins={admins}
          defaultTab={tab === 'tasks' ? 'task' : 'idea'}
          onClose={() => setModalOpen(false)}
          onCreated={handleItemCreated}
        />
      )}
    </>
  )
}
