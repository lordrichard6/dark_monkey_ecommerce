'use client'

import {
  upsertCategory,
  uploadCategoryImage,
  type Category,
  type ActionState,
} from '@/actions/admin-categories'
import { useRouter } from '@/i18n/navigation'
import { useActionState, useEffect, useCallback, useState, useRef } from 'react'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'

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
  const [state, , isPending] = useActionState(upsertCategory, { ok: true } as ActionState)
  const [slugPreview, setSlugPreview] = useState(category?.slug ?? '')
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '')
  const [previewUrl, setPreviewUrl] = useState(category?.image_url ?? '')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)

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

    const result = await upsertCategory({ ok: true }, formData)
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
      <div className="p-6">
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="id" value={category?.id ?? ''} />
          <input type="hidden" name="image_url" value={imageUrl} />

          {/* Name */}
          <div className="space-y-2">
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
              className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
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
              className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500">
              Auto-generated from name. Edit manually if needed.
            </p>
            {slugPreview && (
              <p className="text-xs text-zinc-600">
                <span className="text-zinc-500">URL: </span>
                <span className="font-mono text-amber-500/70">/categories/{slugPreview}</span>
              </p>
            )}
          </div>

          {/* Parent Category — root only */}
          <div className="space-y-2">
            <label htmlFor="parent_id" className="text-sm font-medium leading-none">
              Parent Category
            </label>
            <select
              id="parent_id"
              name="parent_id"
              defaultValue={category?.parent_id ?? ''}
              className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
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

          {/* Sort Order */}
          <div className="space-y-2">
            <label htmlFor="sort_order" className="text-sm font-medium leading-none">
              Sort Order
            </label>
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={category?.sort_order ?? 0}
              required
              className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={category?.description ?? ''}
              placeholder="Category description..."
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>

          {/* Category Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Category Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative w-full overflow-hidden rounded-lg border border-white/10">
                <img src={previewUrl} alt="Category preview" className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 backdrop-blur-sm transition-colors hover:bg-red-500/30"
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
                className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/5 text-zinc-500 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-500"
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-xs">Click to upload image</span>
                <span className="text-[10px] text-zinc-600">PNG, JPEG, WebP, GIF · max 10MB</span>
              </button>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || loading}
              className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {isPending || loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
