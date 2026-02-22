'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  X,
} from 'lucide-react'
import {
  Announcement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
  bulkDeleteAnnouncements,
  bulkToggleAnnouncements,
} from '@/actions/announcements'

// Locales from i18n/routing
const LOCALES = ['en', 'pt', 'de', 'it', 'fr']

const VARIANT_LABELS: Record<string, string> = {
  default: 'Default (amber)',
  info: 'Info (blue)',
  promo: 'Promo (green)',
  warning: 'Warning (yellow)',
}

const VARIANT_BADGE: Record<string, string> = {
  default: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  promo: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
}

const PREVIEW_STYLES: Record<string, { bar: string; icon: string }> = {
  default: { bar: 'bg-zinc-950 border border-white/5', icon: 'text-amber-400' },
  info: { bar: 'bg-blue-950 border border-blue-800', icon: 'text-blue-400' },
  promo: { bar: 'bg-green-950 border border-green-800', icon: 'text-green-400' },
  warning: { bar: 'bg-yellow-950 border border-yellow-800', icon: 'text-yellow-400' },
}

function formatExpiry(expires_at: string | null): string | null {
  if (!expires_at) return null
  return (
    'Expires ' +
    new Date(expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )
}

// ─── Sortable Row ──────────────────────────────────────────────────────────────

type SortableRowProps = {
  announcement: Announcement
  isEditing: boolean
  isSelected: boolean
  editText: string
  editUrl: string
  editExpiresAt: string
  editVariant: Announcement['variant']
  editLocale: string
  onSelect: (id: string, checked: boolean) => void
  onStartEdit: (a: Announcement) => void
  onCancelEdit: () => void
  onSave: () => void
  onEditChange: (field: string, value: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

function SortableRow({
  announcement,
  isEditing,
  isSelected,
  editText,
  editUrl,
  editExpiresAt,
  editVariant,
  editLocale,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSave,
  onEditChange,
  onDelete,
  onToggle,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: announcement.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const expiryLabel = formatExpiry(announcement.expires_at)

  return (
    <div ref={setNodeRef} style={style}>
      {isEditing ? (
        <div className="rounded-lg border border-amber-500/30 bg-zinc-900 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Message</label>
              <input
                type="text"
                value={editText}
                onChange={(e) => onEditChange('text', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Link (optional)
              </label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => onEditChange('url', e.target.value)}
                placeholder="/products/sale"
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Expires at (optional)
              </label>
              <input
                type="datetime-local"
                value={editExpiresAt}
                onChange={(e) => onEditChange('expires_at', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Variant</label>
              <select
                value={editVariant}
                onChange={(e) => onEditChange('variant', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {Object.entries(VARIANT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Locale</label>
              <select
                value={editLocale}
                onChange={(e) => onEditChange('locale', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">All locales</option>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()} only
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-black transition hover:bg-amber-400"
            >
              <Save className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-950 px-3 py-3 transition hover:border-white/10">
          {/* Drag handle */}
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(announcement.id, e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-zinc-800 accent-amber-500"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-zinc-200 truncate">{announcement.text}</p>
              {/* Badges */}
              {announcement.variant !== 'default' && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${VARIANT_BADGE[announcement.variant]}`}
                >
                  {announcement.variant}
                </span>
              )}
              {announcement.locale && (
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                  {announcement.locale.toUpperCase()} only
                </span>
              )}
              {expiryLabel && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  {expiryLabel}
                </span>
              )}
              {!announcement.active && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  Inactive
                </span>
              )}
            </div>
            {announcement.url && (
              <p className="text-xs text-zinc-500 truncate mt-0.5">{announcement.url}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onStartEdit(announcement)}
              className="p-1.5 text-zinc-500 transition hover:text-zinc-200"
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onToggle(announcement.id, announcement.active)}
              className={`p-1.5 transition hover:text-white ${announcement.active ? 'text-green-500' : 'text-zinc-600'}`}
              title={announcement.active ? 'Deactivate' : 'Activate'}
            >
              {announcement.active ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => onDelete(announcement.id)}
              className="p-1.5 text-red-500/40 transition hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Manager ──────────────────────────────────────────────────────────────

type Props = {
  initialAnnouncements: Announcement[]
}

export function AnnouncementsManager({ initialAnnouncements }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Announcement[]>(initialAnnouncements)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [editVariant, setEditVariant] = useState<Announcement['variant']>('default')
  const [editLocale, setEditLocale] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Sync from server on re-render
  useEffect(() => {
    setItems(initialAnnouncements)
  }, [initialAnnouncements])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Drag & drop ──
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      const next = arrayMove(prev, oldIndex, newIndex)
      reorderAnnouncements(next.map((i) => i.id))
      return next
    })
  }

  // ── Inline edit ──
  function startEdit(a: Announcement) {
    setEditingId(a.id)
    setEditText(a.text)
    setEditUrl(a.url ?? '')
    setEditExpiresAt(a.expires_at ? new Date(a.expires_at).toISOString().slice(0, 16) : '')
    setEditVariant(a.variant)
    setEditLocale(a.locale ?? '')
  }

  function handleEditChange(field: string, value: string) {
    if (field === 'text') setEditText(value)
    else if (field === 'url') setEditUrl(value)
    else if (field === 'expires_at') setEditExpiresAt(value)
    else if (field === 'variant') setEditVariant(value as Announcement['variant'])
    else if (field === 'locale') setEditLocale(value)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    await updateAnnouncement(editingId, {
      text: editText,
      url: editUrl || null,
      expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      variant: editVariant,
      locale: editLocale || null,
    })
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingId
          ? {
              ...i,
              text: editText,
              url: editUrl || null,
              expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
              variant: editVariant,
              locale: editLocale || null,
            }
          : i
      )
    )
    setEditingId(null)
    setSaving(false)
  }

  // ── Toggle ──
  async function handleToggle(id: string, currentActive: boolean) {
    const next = !currentActive
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, active: next } : i)))
    await updateAnnouncement(id, { active: next })
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelectedIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
    await deleteAnnouncement(id)
  }

  // ── Checkbox selection ──
  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      checked ? s.add(id) : s.delete(id)
      return s
    })
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(items.map((i) => i.id)) : new Set())
  }

  // ── Bulk actions ──
  async function handleBulkActivate() {
    const ids = Array.from(selectedIds)
    setItems((prev) => prev.map((i) => (selectedIds.has(i.id) ? { ...i, active: true } : i)))
    setSelectedIds(new Set())
    await bulkToggleAnnouncements(ids, true)
  }

  async function handleBulkDeactivate() {
    const ids = Array.from(selectedIds)
    setItems((prev) => prev.map((i) => (selectedIds.has(i.id) ? { ...i, active: false } : i)))
    setSelectedIds(new Set())
    await bulkToggleAnnouncements(ids, false)
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)))
    setSelectedIds(new Set())
    await bulkDeleteAnnouncements(ids)
  }

  // ── Create form ──
  async function handleCreate(formData: FormData) {
    const text = formData.get('text') as string
    if (!text?.trim()) return
    const url = formData.get('url') as string
    const expires_at = formData.get('expires_at') as string
    const variant = (formData.get('variant') as Announcement['variant']) || 'default'
    const locale = formData.get('locale') as string

    setSaving(true)
    await createAnnouncement({
      text,
      url: url || undefined,
      expires_at: expires_at || undefined,
      variant,
      locale: locale || undefined,
    })
    setSaving(false)
    router.refresh()
  }

  // ── Preview ──
  const activeItems = items.filter((i) => i.active)
  const previewItem = activeItems[0]
  const previewVariant = previewItem?.variant ?? 'default'
  const previewStyle = PREVIEW_STYLES[previewVariant] ?? PREVIEW_STYLES.default

  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide preview' : 'Preview bar'}
        </button>
      </div>

      {/* Admin preview */}
      {showPreview && (
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">Store bar preview (first active announcement)</p>
          <div className={`rounded-lg py-2.5 px-4 ${previewStyle.bar}`}>
            {previewItem ? (
              <div className="flex items-center justify-center gap-2">
                <Sparkles className={`h-4 w-4 ${previewStyle.icon}`} />
                {previewItem.url ? (
                  <a
                    href={previewItem.url}
                    className="text-xs font-medium tracking-wide text-zinc-300 hover:underline sm:text-sm"
                  >
                    {previewItem.text}
                  </a>
                ) : (
                  <span className="text-xs font-medium tracking-wide text-zinc-300 sm:text-sm">
                    {previewItem.text}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-center text-xs text-zinc-500">No active announcements</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* List panel */}
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-zinc-800 accent-amber-500"
                aria-label="Select all"
              />
              <h3 className="text-lg font-semibold text-white">All Announcements</h3>
              {saving && <span className="text-xs text-zinc-500 animate-pulse">Saving…</span>}
            </div>

            {/* Bulk action bar */}
            {someSelected && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <span className="text-xs text-zinc-400">{selectedIds.size} selected</span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleBulkActivate}
                    className="rounded-md bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 transition hover:bg-green-500/20"
                  >
                    Activate {selectedIds.size}
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="rounded-md bg-zinc-700/50 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
                  >
                    Deactivate {selectedIds.size}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    Delete {selectedIds.size}
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-zinc-500 text-sm">No announcements yet.</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {items.map((announcement) => (
                      <SortableRow
                        key={announcement.id}
                        announcement={announcement}
                        isEditing={editingId === announcement.id}
                        isSelected={selectedIds.has(announcement.id)}
                        editText={editText}
                        editUrl={editUrl}
                        editExpiresAt={editExpiresAt}
                        editVariant={editVariant}
                        editLocale={editLocale}
                        onSelect={handleSelect}
                        onStartEdit={startEdit}
                        onCancelEdit={() => setEditingId(null)}
                        onSave={saveEdit}
                        onEditChange={handleEditChange}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Create form sidebar */}
        <div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Add New</h3>
            <form action={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Message *</label>
                <input
                  name="text"
                  required
                  type="text"
                  placeholder="e.g. Free shipping over $50"
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Link (optional)
                </label>
                <input
                  name="url"
                  type="text"
                  placeholder="/products/sale"
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Expires at (optional)
                </label>
                <input
                  name="expires_at"
                  type="datetime-local"
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Variant</label>
                <select
                  name="variant"
                  defaultValue="default"
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  {Object.entries(VARIANT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Locale</label>
                <select
                  name="locale"
                  defaultValue=""
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">All locales</option>
                  {LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {l.toUpperCase()} only
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add Announcement
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
