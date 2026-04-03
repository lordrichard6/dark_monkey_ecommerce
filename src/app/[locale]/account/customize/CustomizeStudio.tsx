'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { submitCustomProductRequest } from '@/actions/custom-products'
import { ARTICLE_PRICES_CENTS } from '@/lib/custom-products-config'
import type { ArtStyle, ArticleType } from '@/lib/custom-products-config'
import { Loader2, Upload, X, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

const ART_STYLES: { id: ArtStyle; label: string; emoji: string }[] = [
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { id: 'streetwear', label: 'Streetwear', emoji: '🛹' },
  { id: 'vintage', label: 'Vintage / Retro', emoji: '📼' },
  { id: 'abstract', label: 'Abstract', emoji: '🌀' },
  { id: 'geometric', label: 'Geometric', emoji: '📐' },
  { id: 'anime', label: 'Anime', emoji: '⛩️' },
  { id: 'typography', label: 'Typography', emoji: '🔤' },
  { id: 'photorealistic', label: 'Photorealistic', emoji: '📸' },
]

const ARTICLE_TYPES: { id: ArticleType; label: string; emoji: string }[] = [
  { id: 'tshirt', label: 'T-Shirt', emoji: '👕' },
  { id: 'hoodie', label: 'Hoodie', emoji: '🧥' },
  { id: 'sweatshirt', label: 'Sweatshirt', emoji: '👔' },
  { id: 'cap', label: 'Cap', emoji: '🧢' },
  { id: 'tote_bag', label: 'Tote Bag', emoji: '👜' },
  { id: 'mug', label: 'Mug', emoji: '☕' },
  { id: 'phone_case', label: 'Phone Case', emoji: '📱' },
]

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

type UploadedImage = { url: string; path: string; preview: string }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        const maxW = 1600
        if (width > maxW) {
          height = Math.round((height * maxW) / width)
          width = maxW
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas error'))
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Conversion failed'))),
          'image/webp',
          0.88
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

export function CustomizeStudio({ userId }: { userId: string }) {
  const t = useTranslations('customize')
  const router = useRouter()
  const locale = useLocale()

  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [artStyle, setArtStyle] = useState<ArtStyle | null>(null)
  const [articleType, setArticleType] = useState<ArticleType | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const estimatedPrice = articleType ? ARTICLE_PRICES_CENTS[articleType] : null

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return
      if (images.length >= MAX_IMAGES) return

      setUploading(true)
      setError(null)
      const supabase = createClient()

      const remaining = MAX_IMAGES - images.length
      const toProcess = Array.from(files).slice(0, remaining)

      const newImages: UploadedImage[] = []

      for (const file of toProcess) {
        if (
          !['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'].includes(file.type)
        ) {
          setError('Only JPEG, PNG, WebP or HEIC files are allowed')
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          setError('Each file must be under 10MB')
          continue
        }

        try {
          // Convert to WebP
          const webpBlob = await convertToWebP(file)
          const timestamp = Date.now()
          const fileName = `${userId}/${timestamp}-${Math.random().toString(36).slice(2)}.webp`

          const { data, error: uploadErr } = await supabase.storage
            .from('custom-designs')
            .upload(fileName, webpBlob, {
              contentType: 'image/webp',
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadErr) throw new Error(uploadErr.message)

          const {
            data: { publicUrl },
          } = supabase.storage.from('custom-designs').getPublicUrl(data.path)

          // Local preview from original file
          const preview = URL.createObjectURL(file)
          newImages.push({ url: publicUrl, path: data.path, preview })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed')
        }
      }

      setImages((prev) => [...prev, ...newImages])
      setUploading(false)
    },
    [images.length, userId]
  )

  const removeImage = async (index: number) => {
    const img = images[index]
    const supabase = createClient()
    await supabase.storage.from('custom-designs').remove([img.path])
    URL.revokeObjectURL(img.preview)
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!images.length) return setError(t('errorNoImages'))
    if (!artStyle) return setError(t('errorNoStyle'))
    if (!articleType) return setError(t('errorNoArticle'))
    if (!description.trim()) return setError(t('errorNoDescription'))

    setSubmitting(true)
    const result = await submitCustomProductRequest({
      images: images.map((i) => i.url),
      artStyle,
      articleType,
      description,
      locale,
    })

    if (!result.ok) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.refresh(), 1500)
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="text-xl font-bold text-zinc-50">{t('successTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-400">{t('successBody')}</p>
      </div>
    )
  }

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-zinc-50">{t('newRequestTitle')}</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Image Upload ── */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            {t('imagesLabel')}{' '}
            <span className="text-zinc-500">
              ({images.length}/{MAX_IMAGES})
            </span>
          </label>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((img, i) => (
              <div
                key={img.path}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-zinc-800"
              >
                <Image src={img.preview} alt={`Design ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-zinc-800/50 text-zinc-500 transition hover:border-amber-500/40 hover:bg-zinc-800 hover:text-amber-400 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">{t('uploadBtn')}</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-xs text-zinc-600">{t('imagesHint')}</p>
        </div>

        {/* ── Art Style ── */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">{t('styleLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {ART_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setArtStyle(s.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  artStyle === s.id
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                    : 'border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Article Type ── */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">{t('articleLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {ARTICLE_TYPES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setArticleType(a.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  articleType === a.id
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                    : 'border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <span>{a.emoji}</span>
                {a.label}
                <span className="ml-1 text-xs text-zinc-600">
                  {formatPrice(ARTICLE_PRICES_CENTS[a.id])}
                </span>
              </button>
            ))}
          </div>

          {/* Price estimate */}
          {estimatedPrice && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <span className="text-sm text-zinc-400">{t('estimatedPrice')}</span>
              <span className="text-base font-bold text-amber-400">
                {formatPrice(estimatedPrice)}
              </span>
              <span className="text-xs text-zinc-600">{t('estimatedPriceNote')}</span>
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
            {t('descriptionLabel')}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder={t('descriptionPlaceholder')}
            className="block w-full resize-none rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <p className="text-xs text-zinc-600">{t('descriptionHint')}</p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-bold uppercase tracking-wider text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('submitting')}
            </span>
          ) : (
            t('submitBtn')
          )}
        </button>
      </form>
    </section>
  )
}
