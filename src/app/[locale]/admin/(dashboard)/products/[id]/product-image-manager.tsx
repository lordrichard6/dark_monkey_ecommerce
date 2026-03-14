'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import NextImage from 'next/image'
import { Loader2, X, Upload, ImagePlus, ZoomIn, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  deleteProductImage,
  setPrimaryProductImage,
  updateProductImageColor,
  reorderProductImages,
} from '@/actions/admin-products'
import { useUpload } from '@/contexts/upload-context'
import { Tooltip } from '@/components/admin/Tooltip'

type Image = {
  id: string
  url: string
  alt: string | null
  sort_order?: number
  color?: string | null
  source?: 'printful' | 'custom' | null
}

type Props = {
  productId: string
  images: Image[]
  selectedColor?: string | null
  availableColors?: string[]
}

// ── Color dot helper ─────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  black: '#18181b',
  white: '#f4f4f5',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#71717a',
  grey: '#71717a',
  brown: '#92400e',
  navy: '#1e3a5f',
  beige: '#d4b896',
  cream: '#fffdd0',
  gold: '#d4af37',
  silver: '#c0c0c0',
}

function ColorDot({ name }: { name: string }) {
  const css = COLOR_MAP[name.toLowerCase()] ?? null
  if (!css) return null
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-zinc-500"
      style={{ background: css }}
    />
  )
}

// ── Sortable thumbnail item ──────────────────────────────────────────────────

function SortableThumbnail({
  img,
  isSelected,
  isPrimary,
  isDeleting,
  isSettingPrimary,
  isUpdatingColor,
  availableColors,
  onSelect,
  onDelete,
  onSetPrimary,
  onUpdateColor,
}: {
  img: Image
  isSelected: boolean
  isPrimary: boolean
  isDeleting: boolean
  isSettingPrimary: boolean
  isUpdatingColor: boolean
  availableColors: string[]
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  onSetPrimary: (e: React.MouseEvent) => void
  onUpdateColor: (color: string | null) => void
}) {
  const t = useTranslations('admin')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: img.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="group relative"
    >
      <div
        onClick={onSelect}
        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        {...attributes}
        {...listeners}
        className={`relative h-28 w-28 shrink-0 cursor-grab active:cursor-grabbing overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          isSelected
            ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
            : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
        }`}
      >
        <NextImage
          src={img.url}
          alt={img.alt ?? ''}
          fill
          sizes="112px"
          className="object-cover pointer-events-none"
        />

        {/* Drag handle — visible on hover */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 transition group-hover:opacity-100 pointer-events-none">
          <div className="flex items-center justify-center rounded bg-zinc-950/70 px-1 py-0.5">
            <GripVertical className="h-3 w-3 text-zinc-300" />
          </div>
        </div>

        {/* Cover / Primary marker */}
        {isPrimary ? (
          <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950 shadow-sm">
            {t('images.cover')}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSetPrimary(e)
            }}
            disabled={isSettingPrimary}
            className="absolute left-1 top-1 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition hover:bg-amber-500 hover:text-zinc-950 group-hover:opacity-100 disabled:opacity-50"
          >
            {isSettingPrimary ? '…' : t('images.setCover')}
          </button>
        )}

        {/* Source badge — on hover only */}
        <span
          className={`absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide opacity-0 transition group-hover:opacity-100 ${
            img.source === 'custom'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-zinc-800/90 text-zinc-400'
          }`}
        >
          {img.source === 'custom' ? t('images.custom') : 'Printful'}
        </span>

        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(e)
          }}
          disabled={isDeleting}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        </button>
      </div>

      {/* Color selector with dot */}
      <div className="mt-1.5 flex items-center gap-1">
        {img.color && <ColorDot name={img.color} />}
        <select
          value={img.color || ''}
          onChange={(e) => onUpdateColor(e.target.value || null)}
          disabled={isUpdatingColor}
          className="w-28 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-300 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">{t('images.universal')}</option>
          {availableColors
            .filter((c) => c !== 'Default')
            .map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}

// ── Upload Dialog ─────────────────────────────────────────────────────────────

function UploadDialog({
  onClose,
  onUpload,
  error,
}: {
  onClose: () => void
  onUpload: (files: File[]) => void
  error: string | null
}) {
  const t = useTranslations('admin')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function pickFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    onUpload(Array.from(files))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDraggingOver(false)
    pickFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-zinc-100">{t('images.uploadPhotos')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
              isDraggingOver
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-zinc-700 bg-zinc-800/30 hover:border-amber-500/60 hover:bg-amber-500/5'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                isDraggingOver ? 'bg-amber-500/20' : 'bg-zinc-800'
              }`}
            >
              <Upload
                className={`h-5 w-5 transition-colors ${isDraggingOver ? 'text-amber-400' : 'text-zinc-400'}`}
              />
            </div>

            {isDraggingOver ? (
              <p className="text-sm font-semibold text-amber-400">{t('images.dropToUpload')}</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-300">{t('images.dragDropPhotos')}</p>
                <p className="text-xs text-zinc-500">{t('images.clickToBrowse')}</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <p className="text-center text-[11px] text-zinc-600">{t('images.fileTypes')}</p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={(e) => pickFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProductImageManager({
  productId,
  images: imagesProp,
  selectedColor,
  availableColors = [],
}: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const { startUpload } = useUpload()

  const [localImages, setLocalImages] = useState(imagesProp)
  const [selectedId, setSelectedId] = useState<string | null>(imagesProp[0]?.id ?? null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)
  const [updatingColorId, setUpdatingColorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    setLocalImages(imagesProp)
  }, [imagesProp])

  useEffect(() => {
    if (!selectedColor) {
      setSelectedId(localImages[0]?.id ?? null)
      return
    }
    const colorSpecific = localImages.find((img) => img.color === selectedColor)
    setSelectedId(colorSpecific?.id ?? localImages[0]?.id ?? null)
  }, [selectedColor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightboxUrl(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  const filteredImages = selectedColor
    ? localImages.filter((img) => !img.color || img.color === selectedColor)
    : localImages

  const displayImage = filteredImages.find((img) => img.id === selectedId) ?? filteredImages[0]
  const primaryImageId = localImages[0]?.id ?? null

  // ── DnD ──────────────────────────────────────────────────────────────────

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const oldIndex = localImages.findIndex((img) => img.id === active.id)
    const newIndex = localImages.findIndex((img) => img.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(localImages, oldIndex, newIndex)
    setLocalImages(newOrder)

    const result = await reorderProductImages(newOrder.map((img) => img.id))
    if (!result.ok) {
      setLocalImages(localImages)
      setError(result.error || t('images.reorderFailed'))
    } else {
      router.refresh()
    }
  }

  const activeImage = activeId ? localImages.find((img) => img.id === activeId) : null

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(
    (files: File[]) => {
      if (!files.length) return

      if (files.length > 5) {
        setUploadError(t('images.maxUploadError'))
        return
      }

      // Close the dialog immediately — progress is shown in the global indicator
      setShowUploadDialog(false)
      setUploadError(null)

      // Fire and forget — context handles progress and keeps it visible across navigation
      startUpload(productId, files, selectedColor).then(() => router.refresh())
    },
    [productId, selectedColor, router, startUpload]
  )

  // ── Delete / Primary / Color ──────────────────────────────────────────────

  async function handleUpdateColor(imageId: string, color: string | null) {
    setUpdatingColorId(imageId)
    setError(null)
    const result = await updateProductImageColor(imageId, color)
    setUpdatingColorId(null)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error || t('images.updateFailed'))
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm(t('images.deleteImage'))) return
    setDeletingId(imageId)
    setError(null)
    const result = await deleteProductImage(imageId)
    setDeletingId(null)
    if (result.ok) {
      setLightboxUrl(null)
      router.refresh()
    } else {
      setError(result.error || t('images.deleteFailed'))
    }
  }

  async function handleSetPrimary(imageId: string) {
    if (imageId === primaryImageId) return
    setSettingPrimaryId(imageId)
    setError(null)
    const result = await setPrimaryProductImage(imageId)
    setSettingPrimaryId(null)
    if (result.ok) {
      setSelectedId(imageId)
      router.refresh()
    } else {
      setError(result.error || t('images.setPrimaryFailed'))
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-400">{t('images.title')}</span>
          {localImages.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {filteredImages.length}
              {filteredImages.length !== localImages.length && ` / ${localImages.length}`}
            </span>
          )}
        </div>
        <Tooltip
          content="Upload up to 5 product photos at once. Images are automatically converted to WebP for faster loading. You can drag to reorder after uploading."
          align="right"
          width={230}
        >
          <button
            type="button"
            onClick={() => {
              setUploadError(null)
              setShowUploadDialog(true)
            }}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-sm transition hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-400"
          >
            <Upload className="h-3.5 w-3.5" />
            {t('images.uploadPhotos')}
          </button>
        </Tooltip>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Main image preview */}
      {displayImage ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setLightboxUrl(displayImage.url)}
          onKeyDown={(e) => e.key === 'Enter' && setLightboxUrl(displayImage.url)}
          className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <NextImage
            src={displayImage.url}
            alt={displayImage.alt ?? ''}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/0 opacity-0 backdrop-blur-sm transition-all group-hover:bg-white/15 group-hover:opacity-100">
              <ZoomIn className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setUploadError(null)
            setShowUploadDialog(true)
          }}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/50 text-zinc-500 transition hover:border-amber-500/60 hover:bg-amber-500/5 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-xs">{t('images.uploadFirstPhoto')}</span>
        </button>
      )}

      {/* Sortable thumbnail grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredImages.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-3">
            {filteredImages.map((img) => (
              <SortableThumbnail
                key={img.id}
                img={img}
                isSelected={img.id === selectedId}
                isPrimary={img.id === primaryImageId}
                isDeleting={deletingId === img.id}
                isSettingPrimary={settingPrimaryId === img.id}
                isUpdatingColor={updatingColorId === img.id}
                availableColors={availableColors}
                onSelect={() => setSelectedId(img.id)}
                onDelete={() => handleDelete(img.id)}
                onSetPrimary={() => handleSetPrimary(img.id)}
                onUpdateColor={(color) => handleUpdateColor(img.id, color)}
              />
            ))}
            {filteredImages.length === 0 && localImages.length > 0 && (
              <p className="py-4 text-xs text-zinc-500">{t('images.noImagesForColor')}</p>
            )}
          </div>
        </SortableContext>

        {/* Drag overlay — ghost image while dragging */}
        <DragOverlay>
          {activeImage && (
            <div className="h-28 w-28 overflow-hidden rounded-lg border-2 border-amber-500 shadow-xl ring-4 ring-amber-500/20">
              <NextImage
                src={activeImage.url}
                alt={activeImage.alt ?? ''}
                width={112}
                height={112}
                className="object-cover"
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <UploadDialog
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUpload}
          error={uploadError}
        />
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          role="button"
          tabIndex={0}
          aria-label="Close"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- lightbox uses unconstrained fill dimensions */}
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
