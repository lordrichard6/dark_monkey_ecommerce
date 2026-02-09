'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { uploadProductImage, deleteProductImage, setPrimaryProductImage, updateProductImageColor } from '@/actions/admin-products'

type Image = {
  id: string
  url: string
  alt: string | null
  sort_order?: number
  color?: string | null
}

type Props = {
  productId: string
  images: Image[]
  selectedColor?: string | null
  availableColors?: string[]
}

export function ProductImageManager({ productId, images, selectedColor, availableColors = [] }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)
  const [updatingColorId, setUpdatingColorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset selected index when color changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [selectedColor])

  // Filter images based on selected color (or no color)
  // Show images with matching color OR null (universal)
  // If no specific color selected, show all
  const filteredImages = selectedColor
    ? images.filter(img => !img.color || img.color === selectedColor)
    : images

  const displayImage = filteredImages[selectedIndex] ?? filteredImages[0]
  const primaryImageId = images.length ? images[0]?.id : null // Primary is global, not filtered

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightboxUrl(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadProductImage(productId, formData, selectedColor)
    setUploading(false)

    if (result.ok) {
      router.refresh()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      setError(result.error || 'Upload failed')
    }
  }

  async function handleUpdateColor(imageId: string, color: string | null) {
    setUpdatingColorId(imageId)
    setError(null)
    const result = await updateProductImageColor(imageId, color)
    setUpdatingColorId(null)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error || 'Update failed')
    }
  }

  async function handleDelete(e: React.MouseEvent, imageId: string) {
    e.stopPropagation()
    if (!confirm('Delete this image?')) return

    setDeletingId(imageId)
    setError(null)

    const result = await deleteProductImage(imageId)
    setDeletingId(null)

    if (result.ok) {
      setLightboxUrl(null)
      router.refresh()
    } else {
      setError(result.error || 'Delete failed')
    }
  }

  async function handleSetPrimary(e: React.MouseEvent, imageId: string) {
    e.stopPropagation()
    if (imageId === primaryImageId) return

    setSettingPrimaryId(imageId)
    setError(null)

    const result = await setPrimaryProductImage(imageId)
    setSettingPrimaryId(null)

    if (result.ok) {
      setSelectedIndex(0)
      router.refresh()
    } else {
      setError(result.error || 'Set primary failed')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">Images</span>
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 shadow-sm ring-1 ring-zinc-700/50 transition hover:bg-amber-500/20 hover:text-amber-400 hover:ring-amber-500/30 disabled:opacity-50"
            title="Add images"
          >
            {uploading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </span>
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Main image above - click to expand */}
      {displayImage ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setLightboxUrl(displayImage.url)}
          onKeyDown={(e) => e.key === 'Enter' && setLightboxUrl(displayImage.url)}
          className="relative aspect-square w-48 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <img src={displayImage.url} alt={displayImage.alt ?? ''} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-square w-48 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/50 text-xs text-zinc-500">
          No image
        </div>
      )}

      {/* Small thumbnails below */}
      <div className="flex flex-wrap gap-3">
        {filteredImages.map((img, i) => {
          const isPrimary = img.id === primaryImageId
          return (
            <div key={img.id} className="group relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIndex(i)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedIndex(i)}
                className={`relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${selectedIndex === i ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                  }`}
              >
                <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />

                {/* Primary Marker */}
                {isPrimary && (
                  <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950 shadow-sm">#1</span>
                )}

                {/* Set Primary Button */}
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => handleSetPrimary(e, img.id)}
                    disabled={settingPrimaryId === img.id}
                    className="absolute left-1 top-1 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition hover:bg-amber-500 hover:text-zinc-950 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {settingPrimaryId === img.id ? '…' : 'Set #1'}
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, img.id)}
                  disabled={deletingId === img.id}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </div>

              {/* Color Selector */}
              <div className="mt-1.5">
                <select
                  value={img.color || ''}
                  onChange={(e) => handleUpdateColor(img.id, e.target.value || null)}
                  disabled={updatingColorId === img.id}
                  className="w-20 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-300 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Universal</option>
                  {availableColors.filter(c => c !== 'Default').map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
        {images.length === 0 && (
          <p className="py-4 text-xs text-zinc-500">No images. Click + to upload.</p>
        )}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          role="button"
          tabIndex={0}
          aria-label="Close"
        >
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
