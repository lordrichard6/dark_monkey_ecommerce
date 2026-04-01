'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { BoardItem, AdminProfile, BoardItemType, BoardItemPriority } from '@/actions/admin-board'
import { createBoardItem, updateBoardItem } from '@/actions/admin-board'

type Props = {
  item: BoardItem | null
  admins: AdminProfile[]
  defaultTab: BoardItemType
  onClose: () => void
  onCreated?: () => void
}

function displayName(profile: AdminProfile) {
  return profile.display_name || 'Admin'
}

export function CreateEditModal({ item, admins, defaultTab, onClose, onCreated }: Props) {
  const t = useTranslations('admin.board')
  const router = useRouter()
  const isEdit = !!item

  const [type, setType] = useState<BoardItemType>(item?.type ?? defaultTab)
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [priority, setPriority] = useState<BoardItemPriority>(item?.priority ?? 'medium')
  const [assignedTo, setAssignedTo] = useState(item?.assigned_to ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)

  // Focus title on open
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    let result
    if (isEdit) {
      result = await updateBoardItem(item.id, {
        title,
        description: description || null,
        url: url || null,
        priority,
        assigned_to: assignedTo || null,
      })
    } else {
      result = await createBoardItem({
        type,
        title,
        description: description || undefined,
        url: url || undefined,
        priority,
        assigned_to: assignedTo || undefined,
      })
    }

    if (!result.ok) {
      setError(result.error)
      setSaving(false)
      return
    }

    if (onCreated) onCreated()
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in duration-200 rounded-t-2xl sm:rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-base font-bold text-zinc-100">{isEdit ? t('editItem') : t('newItem')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {!isEdit && (
            <div className="flex gap-1 rounded-xl border border-white/5 bg-zinc-950/60 p-1">
              {(['task', 'idea'] as BoardItemType[]).map((typeKey) => (
                <button key={typeKey} type="button" onClick={() => setType(typeKey)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${type === typeKey ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {t(typeKey as 'task' | 'idea')}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">{t('titleLabel')}</label>
            <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'task' ? t('titlePlaceholderTask') : t('titlePlaceholderIdea')}
              className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">{t('descriptionLabel')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')} rows={3}
              className="resize-none rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">
              {type === 'idea' ? t('urlLabelIdea') : t('urlLabelTask')}{' '}
              <span className="font-normal text-zinc-600">{t('optional')}</span>
            </label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
              className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20" />
          </div>

          {type === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">{t('priorityLabel')}</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as BoardItemPriority)}
                  className="rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20">
                  <option value="low">{t('low')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="high">{t('high')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">
                  {t('assignToLabel')} <span className="font-normal text-zinc-600">{t('optional')}</span>
                </label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20">
                  <option value="">{t('unassigned')}</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{displayName(a)}</option>)}
                </select>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200">
              {t('cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-60 active:scale-95">
              {saving ? t('saving') : isEdit ? t('saveChanges') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
