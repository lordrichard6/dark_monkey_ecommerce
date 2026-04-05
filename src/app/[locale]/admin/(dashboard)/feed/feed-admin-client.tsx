'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import {
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  type FeedPost,
  type FeedPostType,
} from '@/actions/feed'

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 rounded border border-zinc-700 bg-zinc-800/40 animate-pulse" />
    ),
  }
)

const POST_TYPES: { value: FeedPostType; label: string; color: string }[] = [
  { value: 'drop', label: 'Drop', color: 'bg-purple-500/20 text-purple-300 border-purple-700' },
  { value: 'promo', label: 'Promo', color: 'bg-amber-500/20 text-amber-300 border-amber-700' },
  { value: 'story', label: 'Story', color: 'bg-sky-500/20 text-sky-300 border-sky-700' },
  {
    value: 'community',
    label: 'Community',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-700',
  },
  {
    value: 'new_product',
    label: 'New Product',
    color: 'bg-rose-500/20 text-rose-300 border-rose-700',
  },
  { value: 'sale', label: 'Sale', color: 'bg-orange-500/20 text-orange-300 border-orange-700' },
]

function typeBadge(type: FeedPostType) {
  const t = POST_TYPES.find((p) => p.value === type)
  if (!t) return null
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${t.color}`}
    >
      {t.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type Mode = 'list' | 'create' | 'edit'

type FormState = {
  type: FeedPostType
  title: string
  body: string
  image_url: string
  product_id: string
  is_published: boolean
}

const DEFAULT_FORM: FormState = {
  type: 'drop',
  title: '',
  body: '',
  image_url: '',
  product_id: '',
  is_published: false,
}

function formFromPost(post: FeedPost): FormState {
  return {
    type: post.type,
    title: post.title,
    body: post.body ?? '',
    image_url: post.image_url ?? '',
    product_id: post.product_id ?? '',
    is_published: post.is_published,
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FeedAdminClient({ posts: initialPosts }: { posts: FeedPost[] }) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
  const [mode, setMode] = useState<Mode>('list')
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)

  // -- Navigation helpers ---------------------------------------------------

  function openCreate() {
    setForm(DEFAULT_FORM)
    setEditingPost(null)
    setMode('create')
  }

  function openEdit(post: FeedPost) {
    setForm(formFromPost(post))
    setEditingPost(post)
    setMode('edit')
  }

  function backToList() {
    setMode('list')
    setEditingPost(null)
  }

  // -- Inline publish toggle ------------------------------------------------

  async function handleTogglePublish(post: FeedPost) {
    const next = !post.is_published
    const result = await updateFeedPost(post.id, { is_published: next })
    if (result.ok) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_published: next } : p)))
      toast.success(next ? 'Post published.' : 'Post set to draft.')
    } else {
      toast.error(result.error ?? 'Failed to update post.')
    }
  }

  // -- Delete ---------------------------------------------------------------

  async function handleDelete(post: FeedPost) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    const result = await deleteFeedPost(post.id)
    if (result.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
      toast.success('Post deleted.')
    } else {
      toast.error(result.error ?? 'Failed to delete post.')
    }
  }

  // -- Submit (create / edit) -----------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required.')
      return
    }

    setSubmitting(true)

    const payload = {
      type: form.type,
      title: form.title.trim(),
      body: form.body || undefined,
      image_url: form.image_url.trim() || undefined,
      product_id: form.product_id.trim() || undefined,
      is_published: form.is_published,
    }

    if (mode === 'create') {
      const result = await createFeedPost(payload)
      setSubmitting(false)
      if (result.ok && result.id) {
        // Build a minimal optimistic post and prepend it
        const newPost: FeedPost = {
          id: result.id,
          type: form.type,
          title: form.title.trim(),
          body: form.body || null,
          image_url: form.image_url.trim() || null,
          product_id: form.product_id.trim() || null,
          author_id: null,
          is_published: form.is_published,
          published_at: form.is_published ? new Date().toISOString() : null,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setPosts((prev) => [newPost, ...prev])
        toast.success('Post created.')
        backToList()
      } else {
        toast.error(result.error ?? 'Failed to create post.')
      }
    } else if (mode === 'edit' && editingPost) {
      const result = await updateFeedPost(editingPost.id, payload)
      setSubmitting(false)
      if (result.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingPost.id
              ? {
                  ...p,
                  type: form.type,
                  title: form.title.trim(),
                  body: form.body || null,
                  image_url: form.image_url.trim() || null,
                  product_id: form.product_id.trim() || null,
                  is_published: form.is_published,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        )
        toast.success('Post updated.')
        backToList()
      } else {
        toast.error(result.error ?? 'Failed to update post.')
      }
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (mode === 'create' || mode === 'edit') {
    return (
      <EditorView
        mode={mode}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={backToList}
      />
    )
  }

  return (
    <ListView
      posts={posts}
      onNew={openCreate}
      onEdit={openEdit}
      onTogglePublish={handleTogglePublish}
      onDelete={handleDelete}
    />
  )
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

function ListView({
  posts,
  onNew,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  posts: FeedPost[]
  onNew: () => void
  onEdit: (post: FeedPost) => void
  onTogglePublish: (post: FeedPost) => void
  onDelete: (post: FeedPost) => void
}) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Feed</h1>
        <button
          type="button"
          onClick={onNew}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          New Post
        </button>
      </div>

      {/* Mobile cards */}
      <div className="mt-8 space-y-4 md:hidden">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
            No posts yet. Create one above.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  {typeBadge(post.type)}
                  <p className="text-sm font-semibold text-zinc-100 mt-1">{post.title}</p>
                </div>
                <PublishToggle
                  published={post.is_published}
                  onToggle={() => onTogglePublish(post)}
                />
              </div>
              <p className="text-xs text-zinc-500">{formatDate(post.created_at)}</p>
              <div className="flex gap-2 pt-1 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => onEdit(post)}
                  className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Edit
                </button>
                <span className="text-zinc-700">·</span>
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  className="text-xs text-rose-500 hover:text-rose-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="mt-8 hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                    No posts yet. Create one above.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="group hover:bg-zinc-800/20 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">{typeBadge(post.type)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-100 max-w-xs truncate">
                      {post.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <PublishToggle
                        published={post.is_published}
                        onToggle={() => onTogglePublish(post)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => onEdit(post)}
                          className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(post)}
                          className="text-xs text-rose-500 hover:text-rose-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Publish toggle pill
// ---------------------------------------------------------------------------

function PublishToggle({ published, onToggle }: { published: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        published
          ? 'border-emerald-700 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          : 'border-zinc-700 bg-zinc-800/60 text-zinc-500 hover:bg-zinc-700/60'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-emerald-400' : 'bg-zinc-600'}`}
      />
      {published ? 'Published' : 'Draft'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Editor view
// ---------------------------------------------------------------------------

function EditorView({
  mode,
  form,
  setForm,
  submitting,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}) {
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-zinc-50">
          {mode === 'create' ? 'New Post' : 'Edit Post'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-6">
        {/* Type */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as FeedPostType)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
          >
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Post title"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Body
          </label>
          <RichTextEditor
            value={form.body}
            onChange={(val) => set('body', val)}
            minHeight="180px"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Image URL
          </label>
          <p className="mb-2 text-xs text-zinc-600">
            Optional. Full URL to a cover image for this post.
          </p>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Product ID */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Product ID
          </label>
          <p className="mb-2 text-xs text-zinc-600">
            Enter a product UUID to link a product to this post (optional).
          </p>
          <input
            type="text"
            value={form.product_id}
            onChange={(e) => set('product_id', e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.is_published}
            onClick={() => set('is_published', !form.is_published)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              form.is_published ? 'bg-amber-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.is_published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <label className="text-sm font-medium text-zinc-300">
            {form.is_published ? 'Published' : 'Draft'}
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-zinc-800">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
                ? 'Create Post'
                : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
