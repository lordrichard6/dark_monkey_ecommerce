'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import NextImage from 'next/image'
import { Loader2, X, Upload, ImagePlus, ZoomIn } from 'lucide-react'
import {
  deleteProductImage,
  setPrimaryProductImage,
  setSecondaryProductImage,
  updateProductImageColor,
  updateProductImageAlt,
} from '@/actions/admin-products'
import { useUpload } from '@/contexts/upload-context'
import { Tooltip } from '@/components/admin/Tooltip'
import { colorToHex } from '@/lib/color-swatch'
import { ColorOption } from '@/types/product'

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
  availableColors?: ColorOption[]
}

// ── Mockup background — warm dark radial gradient + dot pattern ─────────────

const MOCKUP_BG: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(ellipse 160% 50% at 50% 115%, rgba(245,158,11,0.09) 0%, transparent 55%)',
    'radial-gradient(ellipse at 50% 25%, #2e2e32 0%, #18181b 70%)',
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='1' cy='1' r='1' fill='white' fill-opacity='0.025'/%3E%3C/svg%3E\")",
  ].join(', '),
}

const THUMBNAIL_BG: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(ellipse at 50% 110%, rgba(245,158,11,0.1) 0%, transparent 60%)',
    'radial-gradient(ellipse at 50% 20%, #2a2a2e 0%, #18181b 80%)',
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='1' cy='1' r='1' fill='white' fill-opacity='0.025'/%3E%3C/svg%3E\")",
  ].join(', '),
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

// ── Alt text inline editor ────────────────────────────────────────────────────

function AltTextField({ imageId, initialAlt }: { imageId: string; initialAlt: string }) {
  const t = useTranslations('admin')
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialAlt)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateProductImageAlt(imageId, value)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-1 flex w-28 gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') {
              setValue(initialAlt)
              setEditing(false)
            }
          }}
          className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-200 focus:border-amber-500 focus:outline-none"
          placeholder={t('images.altTextPlaceholder')}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-amber-500 px-1 py-0.5 text-[9px] font-bold text-zinc-950 disabled:opacity-50"
        >
          ✓
        </button>
      </div>
    )
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className="mt-0.5 w-28 cursor-pointer truncate text-[10px] text-zinc-600 hover:text-zinc-400 transition"
      title={value || t('images.altText')}
    >
      {value || <span className="italic">{t('images.altText')}</span>}
    </p>
  )
}

// ── Thumbnail item ────────────────────────────────────────────────────────────

function Thumbnail({
  img,
  isSelected,
  isPrimary,
  isSecondary,
  isDeleting,
  isSettingPrimary,
  isSettingSecondary,
  isUpdatingColor,
  availableColors,
  onSelect,
  onDelete,
  onSetPrimary,
  onSetSecondary,
  onUpdateColor,
}: {
  img: Image
  isSelected: boolean
  isPrimary: boolean
  isSecondary: boolean
  isDeleting: boolean
  isSettingPrimary: boolean
  isSettingSecondary: boolean
  isUpdatingColor: boolean
  availableColors: string[]
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  onSetPrimary: (e: React.MouseEvent) => void
  onSetSecondary: (e: React.MouseEvent) => void
  onUpdateColor: (color: string | null) => void
}) {
  const t = useTranslations('admin')

  return (
    <div className="group relative">
      <div
        onClick={onSelect}
        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        tabIndex={0}
        role="button"
        style={THUMBNAIL_BG}
        className={`relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          isSelected
            ? 'border-amber-500 ring-2 ring-amber-500/30'
            : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        {/* Color identity strip — top edge */}
        {img.color && (
          <div
            className="absolute top-0 left-0 right-0 h-1 z-20 pointer-events-none"
            style={{ background: COLOR_MAP[img.color.toLowerCase()] ?? '#71717a' }}
          />
        )}
        {/* Selected tint overlay */}
        {isSelected && <div className="pointer-events-none absolute inset-0 z-10 bg-amber-500/8" />}
        <NextImage
          src={img.url}
          alt={img.alt ?? ''}
          fill
          sizes="112px"
          className="object-contain pointer-events-none"
        />

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

        {/* Cover 2 / Secondary marker */}
        {!isPrimary &&
          (isSecondary ? (
            <span className="absolute left-1 top-7 rounded bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Cover 2
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSetSecondary(e)
              }}
              disabled={isSettingSecondary}
              className="absolute left-1 top-7 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition hover:bg-violet-500 hover:text-white group-hover:opacity-100 disabled:opacity-50"
            >
              {isSettingSecondary ? '…' : 'Cover 2'}
            </button>
          ))}

        {/* Source badge */}
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

      {/* Color selector */}
      <div className="mt-1.5 flex items-center gap-1">
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
      {/* Alt text inline edit */}
      <AltTextField imageId={img.id} initialAlt={img.alt ?? ''} />
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
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingOver(false)
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
        <div className="space-y-4 p-5">
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
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isDraggingOver ? 'bg-amber-500/20' : 'bg-zinc-800'}`}
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
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
          <p className="text-center text-[11px] text-zinc-600">{t('images.fileTypes')}</p>
        </div>
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

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)
  const [settingSecondaryId, setSettingSecondaryId] = useState<string | null>(null)
  const [updatingColorId, setUpdatingColorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    setLocalImages(imagesProp)
  }, [imagesProp])

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightboxUrl(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  const displayImage = localImages.find((img) => img.id === selectedId) ?? localImages[0]
  const primaryImageId = localImages[0]?.id ?? null
  const secondaryImageId = localImages[1]?.id ?? null

  const handleUpload = useCallback(
    (files: File[]) => {
      if (!files.length) return
      if (files.length > 5) {
        setUploadError(t('images.maxUploadError'))
        return
      }
      setShowUploadDialog(false)
      setUploadError(null)
      startUpload(productId, files, selectedColor).then(() => router.refresh())
    },
    [productId, selectedColor, router, startUpload, t]
  )

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

  async function handleSetSecondary(imageId: string) {
    if (imageId === secondaryImageId || imageId === primaryImageId) return
    setSettingSecondaryId(imageId)
    setError(null)
    const result = await setSecondaryProductImage(imageId)
    setSettingSecondaryId(null)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error || 'Failed to set Cover 2')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-400">{t('images.title')}</span>
          {localImages.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {localImages.length}
            </span>
          )}
        </div>
        <Tooltip
          content="Upload up to 5 product photos at once. Images are automatically converted to WebP for faster loading."
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
          style={MOCKUP_BG}
          className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <NextImage
            src={displayImage.url}
            alt={displayImage.alt ?? ''}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
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
          style={MOCKUP_BG}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 text-zinc-500 transition hover:border-amber-500/60 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-xs">{t('images.uploadFirstPhoto')}</span>
        </button>
      )}

      {/* Informational color chips */}
      {availableColors.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Colors
          </p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => {
              const hex = c.hex || colorToHex(c.name)
              const background = c.hex2 ? `linear-gradient(135deg, ${hex} 50%, ${c.hex2} 50%)` : hex
              return (
                <div key={c.name} className="flex flex-col items-center gap-1">
                  <div
                    className="h-7 w-7 rounded-lg border border-zinc-700"
                    style={{ background }}
                    title={c.name}
                  />
                  <span className="max-w-[44px] truncate text-center text-[9px] leading-tight text-zinc-500">
                    {c.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Thumbnail grid */}
      <div className="flex flex-wrap gap-3">
        {localImages.map((img) => (
          <Thumbnail
            key={img.id}
            img={img}
            isSelected={img.id === selectedId}
            isPrimary={img.id === primaryImageId}
            isSecondary={img.id === secondaryImageId}
            isDeleting={deletingId === img.id}
            isSettingPrimary={settingPrimaryId === img.id}
            isSettingSecondary={settingSecondaryId === img.id}
            isUpdatingColor={updatingColorId === img.id}
            availableColors={availableColors.map((c) => c.name)}
            onSelect={() => setSelectedId(img.id)}
            onDelete={() => handleDelete(img.id)}
            onSetPrimary={() => handleSetPrimary(img.id)}
            onSetSecondary={() => handleSetSecondary(img.id)}
            onUpdateColor={(color) => handleUpdateColor(img.id, color)}
          />
        ))}
      </div>

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
