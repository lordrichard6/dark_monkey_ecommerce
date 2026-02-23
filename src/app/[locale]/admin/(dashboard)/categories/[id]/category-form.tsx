'use client'

import {
  upsertCategory,
  uploadCategoryImage,
  type Category,
  type ActionState,
} from '@/actions/admin-categories'
import { useRouter } from '@/i18n/navigation'
import { useCallback, useState, useRef } from 'react'
import { toast } from 'sonner'
import { ImagePlus, X, ArrowLeft } from 'lucide-react'

interface CategoryFormProps {
  category?: Category | null
  categories: Category[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter()
  const [slugPreview, setSlugPreview] = useState(category?.slug ?? '')
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '')
  const [previewUrl, setPreviewUrl] = useState(category?.image_url ?? '')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Upload image first if a new file was selected
    if (pendingFile) {
      const uploadData = new FormData()
      uploadData.set('image_file', pendingFile)
      const uploaded = await uploadCategoryImage(uploadData)
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        setLoading(false)
        return
      }
      formData.set('image_url', uploaded.url)
      setImageUrl(uploaded.url)
    } else {
      formData.set('image_url', imageUrl)
    }

    const result = await upsertCategory({ ok: true } as ActionState, formData)
    setLoading(false)
    if (result.ok) {
      toast.success('Category saved')
      router.push('/admin/categories')
    } else {
      toast.error(result.error)
    }
  }

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only auto-fill slug when creating a new category
      if (category) return
      const slugInput = document.getElementById('slug') as HTMLInputElement | null
      if (slugInput && !slugInput.dataset.userEdited) {
        const generated = slugify(e.target.value)
        slugInput.value = generated
        setSlugPreview(generated)
      }
    },
    [category]
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
  }

  function handleRemoveImage() {
    setPendingFile(null)
    setPreviewUrl('')
    setImageUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Root-level categories only (no parent), excluding self
  const rootCategories = categories.filter((c) => !c.parent_id && c.id !== category?.id)

  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="id" value={category?.id ?? ''} />
          <input type="hidden" name="image_url" value={imageUrl} />

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={category?.name}
              placeholder="e.g. Hoodies"
              required
              onChange={handleNameChange}
              className="flex h-11 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium leading-none">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={category?.slug}
              placeholder="e.g. hoodies"
              required
              onInput={(e) => {
                const input = e.target as HTMLInputElement
                input.dataset.userEdited = '1'
                setSlugPreview(input.value)
              }}
              className="flex h-11 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 font-mono text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500">
              Auto-generated from name. Edit manually if needed.
            </p>
            {slugPreview && (
              <p className="break-all text-xs text-zinc-600">
                <span className="text-zinc-500">URL: </span>
                <span className="font-mono text-amber-500/70">/categories/{slugPreview}</span>
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div className="space-y-1.5">
            <label htmlFor="parent_id" className="text-sm font-medium leading-none">
              Parent Category
            </label>
            <select
              id="parent_id"
              name="parent_id"
              defaultValue={category?.parent_id ?? ''}
              className="flex h-11 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <option value="">None (Top Level)</option>
              {rootCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">Only top-level categories can be parents.</p>
          </div>

          {/* Sort Order + Description — side by side on larger screens */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[120px_1fr]">
            <div className="space-y-1.5">
              <label htmlFor="sort_order" className="text-sm font-medium leading-none">
                Sort Order
              </label>
              <input
                id="sort_order"
                name="sort_order"
                type="number"
                defaultValue={category?.sort_order ?? 0}
                required
                className="flex h-11 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium leading-none">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={category?.description ?? ''}
                placeholder="Category description..."
                rows={1}
                className="flex w-full rounded-md border border-white/10 bg-transparent px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          {/* Category Image Upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Category Image</label>
            <p className="text-xs text-zinc-500">
              Square format (1:1) — 1200×1200 px min. PNG, JPEG, WebP.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-white/10">
                <div className="aspect-square w-full sm:aspect-video">
                  <img
                    src={previewUrl}
                    alt="Category preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 px-3 py-2 text-xs font-medium text-red-400 backdrop-blur-sm transition-colors hover:bg-red-500/30 active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/5 text-zinc-500 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-500 active:scale-[0.98]"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Tap to upload image</span>
                <span className="text-xs text-zinc-600">PNG, JPEG, WebP · max 10MB</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[0.98] sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-md bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-amber-600 disabled:opacity-50 active:scale-[0.98] sm:w-auto"
            >
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
