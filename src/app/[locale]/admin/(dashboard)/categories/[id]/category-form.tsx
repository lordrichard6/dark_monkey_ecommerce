'use client'

import { upsertCategory, type Category, type ActionState } from '@/actions/admin-categories'
import { useRouter } from '@/i18n/navigation'
import { useActionState, useEffect, useCallback, useState } from 'react'
import { toast } from 'sonner'

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
  const [state, action, isPending] = useActionState(upsertCategory, { ok: true } as ActionState)
  const [slugPreview, setSlugPreview] = useState(category?.slug ?? '')

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  const handleSubmit = async (formData: FormData) => {
    const result = await upsertCategory({ ok: true }, formData)
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

  // Root-level categories only (no parent), excluding self
  const rootCategories = categories.filter((c) => !c.parent_id && c.id !== category?.id)

  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="p-6">
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="id" value={category?.id ?? ''} />

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

          {/* Image URL */}
          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium leading-none">
              Image URL
            </label>
            <input
              id="image_url"
              name="image_url"
              defaultValue={category?.image_url ?? ''}
              placeholder="e.g. /images/categories/hoodies.jpg"
              className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
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
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
