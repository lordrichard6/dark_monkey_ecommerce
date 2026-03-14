'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  AlertTriangle,
  Pencil,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ProductActionsDropdown } from '@/app/[locale]/admin/(dashboard)/products/product-actions-dropdown'
import { SyncPrintfulButton } from '@/app/[locale]/admin/(dashboard)/products/sync-printful-button'
import {
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  updateProductStatus,
} from '@/actions/admin-products'
import { CategoryPickerDialog, type PickerCategory } from './CategoryPickerDialog'
import { useFocusTrap } from '@/hooks/useFocusTrap'

type Tag = { id: string; name: string }

type Product = {
  id: string
  name: string
  slug: string
  is_active: boolean
  is_customizable: boolean
  category_id: string | null
  categories: { id: string; name: string } | null
  product_images: { id: string; url: string; sort_order?: number }[]
  product_variants: { id: string; price_cents: number }[]
  product_tags: Tag[]
  created_at: string
}

type Props = {
  products: Product[]
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  categories: PickerCategory[]
  search: string
  statusFilter: string
  categoryFilter: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

type PickerTarget = { id: string; name: string; categoryId: string | null }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// ─── Inline Status Toggle ────────────────────────────────────────────────────
function ToggleStatusButton({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [optimistic, setOptimistic] = useState(isActive)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const next = !optimistic
    setOptimistic(next)
    setLoading(true)
    const result = await updateProductStatus(productId, next)
    setLoading(false)
    if (!result.ok) {
      setOptimistic(!next)
      toast.error(result.error ?? t('status.failedToUpdate'))
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={optimistic ? t('status.clickToDeactivate') : t('status.clickToActivate')}
      className={`group inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium transition-all disabled:opacity-50 ${
        optimistic
          ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/70'
          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full transition-colors ${
          optimistic ? 'bg-emerald-400' : 'bg-zinc-500 group-hover:bg-zinc-400'
        }`}
      />
      {optimistic ? t('status.active') : t('status.inactive')}
    </button>
  )
}

// ─── Sort Icon ───────────────────────────────────────────────────────────────
function SortIcon({
  col,
  sortBy,
  sortDir,
}: {
  col: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}) {
  if (sortBy !== col)
    return (
      <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-zinc-600 opacity-0 group-hover/th:opacity-100" />
    )
  return sortDir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-amber-400" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-amber-400" />
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ProductListTable({
  products,
  currentPage,
  totalPages,
  totalCount,
  limit,
  categories,
  search,
  statusFilter,
  categoryFilter,
  sortBy,
  sortDir,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('admin')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<'status' | 'delete' | null>(null)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Focus trap + Escape key for the bulk-delete confirmation dialog
  const bulkDeleteRef = useRef<HTMLDivElement>(null)
  useFocusTrap(bulkDeleteRef, bulkDeleteOpen)

  useEffect(() => {
    if (!bulkDeleteOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBulkDeleteOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [bulkDeleteOpen])

  // Local controlled search input (push to URL on submit/debounce)
  const [searchInput, setSearchInput] = useState(search)

  const safeProducts = products || []
  const allSelected = safeProducts.length > 0 && selectedIds.size === safeProducts.length
  const indeterminate = selectedIds.size > 0 && selectedIds.size < safeProducts.length

  // ── URL param helper ──────────────────────────────────────────────────────
  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    // Reset to page 1 when filters change
    if (!('page' in updates)) params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    pushParams({ search: searchInput || null })
  }

  function handleSearchClear() {
    setSearchInput('')
    pushParams({ search: null })
  }

  function handleSortClick(col: string) {
    if (sortBy === col) {
      pushParams({ sort: col, dir: sortDir === 'asc' ? 'desc' : 'asc' })
    } else {
      pushParams({ sort: col, dir: 'desc' })
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(safeProducts.map((p) => p.id)))
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // ── Bulk Actions ──────────────────────────────────────────────────────────
  async function handleBulkDeleteConfirm() {
    setLoading('delete')
    const result = await bulkDeleteProducts(Array.from(selectedIds))
    setLoading(null)
    setBulkDeleteOpen(false)
    if (result.ok) {
      setSelectedIds(new Set())
      router.refresh()
    } else {
      toast.error(result.error ?? t('dangerZone.failedToDelete'))
    }
  }

  async function handleBulkStatus(isActive: boolean) {
    setLoading('status')
    const result = await bulkUpdateProductStatus(Array.from(selectedIds), isActive)
    setLoading(null)
    if (result.ok) {
      setSelectedIds(new Set())
      router.refresh()
    } else {
      toast.error(result.error ?? t('status.failedToUpdate'))
    }
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return
    pushParams({ page: page.toString() })
  }

  // Compute page start/end for display
  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1
  const pageEnd = Math.min(currentPage * limit, totalCount)

  const parentCategories = categories.filter((c) => !c.parent_id)

  return (
    <div>
      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: search + filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('products.searchProducts')}
              className="h-8 w-48 rounded-lg border border-zinc-700 bg-zinc-900 pl-8 pr-8 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 sm:w-56"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => pushParams({ status: e.target.value || null })}
            className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="">{t('products.allStatus')}</option>
            <option value="active">{t('products.active')}</option>
            <option value="inactive">{t('products.inactive')}</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => pushParams({ category: e.target.value || null })}
            className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="">{t('products.allCategories')}</option>
            {parentCategories.map((cat) => {
              const subs = categories.filter((c) => c.parent_id === cat.id)
              if (subs.length === 0) {
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                )
              }
              return (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{t('fields.allOf', { name: cat.name })}</option>
                  {subs.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>

          {/* Active filter chips */}
          {(search || statusFilter || categoryFilter) && (
            <button
              onClick={() => {
                setSearchInput('')
                pushParams({ search: null, status: null, category: null })
              }}
              className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
              {t('products.clearFilters')}
            </button>
          )}
        </div>

        {/* Right: per-page + count */}
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span className="whitespace-nowrap">
            {totalCount === 0
              ? t('products.noProducts')
              : `${pageStart}–${pageEnd} of ${totalCount}`}
          </span>
          <select
            value={limit}
            onChange={(e) => pushParams({ limit: e.target.value, page: '1' })}
            className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-400 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* ── Bulk Actions Toolbar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 shadow-lg">
          <span className="text-sm text-zinc-300 font-medium">
            {t('products.selected', { count: selectedIds.size })}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatus(true)}
              disabled={loading !== null}
              className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {t('products.setActive')}
            </button>
            <button
              onClick={() => handleBulkStatus(false)}
              disabled={loading !== null}
              className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {t('products.setInactive')}
            </button>
            <div className="mx-2 hidden h-4 w-px bg-zinc-600 sm:block" />
            <button
              onClick={() => setBulkDeleteOpen(true)}
              disabled={loading !== null}
              className="rounded bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
            >
              {t('products.deleteSelected')}
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Select All ────────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center justify-end px-1 md:hidden">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = indeterminate
            }}
            onChange={toggleSelectAll}
          />
          {t('products.selectAll')}
        </label>
      </div>

      {/* ── Desktop Table View ───────────────────────────────────────────────── */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-800 md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = indeterminate
                  }}
                  onChange={toggleSelectAll}
                />
              </th>
              {/* Thumbnail */}
              <th className="w-14 px-4 py-3 text-left text-sm font-medium text-zinc-400" />
              {/* Product name — sortable */}
              <th className="group/th px-4 py-3 text-left text-sm font-medium text-zinc-400">
                <button
                  onClick={() => handleSortClick('name')}
                  className="flex items-center whitespace-nowrap hover:text-zinc-200"
                >
                  {t('products.product')}
                  <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                {t('products.category')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                {t('products.tags')}
              </th>
              {/* Images count */}
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                {t('products.images')}
              </th>
              {/* Price range — sortable (client-side note) */}
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                {t('products.priceRange')}
              </th>
              {/* Date — sortable */}
              <th className="group/th px-4 py-3 text-left text-sm font-medium text-zinc-400">
                <button
                  onClick={() => handleSortClick('created_at')}
                  className="flex items-center whitespace-nowrap hover:text-zinc-200"
                >
                  {t('orders.date')}
                  <SortIcon col="created_at" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              {/* Status — sortable */}
              <th className="group/th px-4 py-3 text-left text-sm font-medium text-zinc-400">
                <button
                  onClick={() => handleSortClick('is_active')}
                  className="flex items-center whitespace-nowrap hover:text-zinc-200"
                >
                  {t('dashboard.status')}
                  <SortIcon col="is_active" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                {t('dashboard.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {safeProducts.map((p) => {
              const variants = p.product_variants ?? []
              const images = (p.product_images ?? []).sort(
                (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
              )
              const thumbnailUrl = images[0]?.url
              const minPrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
              const maxPrice = variants.length ? Math.max(...variants.map((v) => v.price_cents)) : 0
              const priceRange =
                minPrice === maxPrice
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
              const isSelected = selectedIds.has(p.id)
              const tags = p.product_tags ?? []

              return (
                <tr
                  key={p.id}
                  className={`border-b border-zinc-800/50 transition-colors ${
                    isSelected ? 'bg-amber-500/5' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
                      checked={isSelected}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {thumbnailUrl ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded ring-1 ring-zinc-700">
                          <Image
                            src={thumbnailUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500 ring-1 ring-zinc-700">
                          —
                        </div>
                      )}
                    </Link>
                  </td>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium text-zinc-50 hover:text-amber-400"
                    >
                      {p.name}
                    </Link>
                    {p.is_customizable && (
                      <span className="ml-2 rounded bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">
                        Customizable
                      </span>
                    )}
                  </td>
                  {/* Category */}
                  <td
                    className="group/cat cursor-pointer px-4 py-3 text-sm text-zinc-400"
                    onClick={() =>
                      setPickerTarget({ id: p.id, name: p.name, categoryId: p.category_id })
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {p.categories ? (
                        <>
                          <span>{p.categories.name}</span>
                          <Pencil className="h-3 w-3 text-zinc-600 opacity-0 transition-opacity group-hover/cat:opacity-100" />
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-medium text-amber-500">
                            {t('products.missingCategory')}
                          </span>
                          <Pencil className="h-3 w-3 text-amber-600 opacity-0 transition-opacity group-hover/cat:opacity-100" />
                        </>
                      )}
                    </div>
                  </td>
                  {/* Tags */}
                  <td className="px-4 py-3">
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 ring-1 ring-zinc-700"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-700">
                            +{tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  {/* Images count — warning if 0 */}
                  <td className="px-4 py-3 text-sm">
                    {images.length === 0 ? (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium text-amber-500">0</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">{images.length}</span>
                    )}
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3 text-sm text-zinc-300">{priceRange}</td>
                  {/* Date */}
                  <td className="px-4 py-3 text-sm text-zinc-400">{formatDate(p.created_at)}</td>
                  {/* Status — quick toggle */}
                  <td className="px-4 py-3">
                    <ToggleStatusButton productId={p.id} isActive={p.is_active} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <ProductActionsDropdown
                      productId={p.id}
                      productName={p.name}
                      productSlug={p.slug}
                      isActive={p.is_active}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {safeProducts.map((p) => {
          const variants = p.product_variants ?? []
          const images = (p.product_images ?? []).sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
          const thumbnailUrl = images[0]?.url
          const minPrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
          const maxPrice = variants.length ? Math.max(...variants.map((v) => v.price_cents)) : 0
          const priceRange =
            minPrice === maxPrice
              ? formatPrice(minPrice)
              : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
          const isSelected = selectedIds.has(p.id)
          const tags = p.product_tags ?? []

          return (
            <div
              key={p.id}
              className={`relative flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors ${
                isSelected ? 'border-amber-500/50 bg-amber-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Link href={`/admin/products/${p.id}`} className="block shrink-0">
                    {thumbnailUrl ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-md ring-1 ring-zinc-700">
                        <Image
                          src={thumbnailUrl}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-zinc-800 ring-1 ring-zinc-700">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium text-zinc-50 hover:text-amber-400 line-clamp-2"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setPickerTarget({ id: p.id, name: p.name, categoryId: p.category_id })
                        }
                        className="flex items-center gap-1 transition-colors hover:text-amber-400"
                      >
                        {p.categories ? (
                          <>
                            <span className="text-zinc-400">{p.categories.name}</span>
                            <Pencil className="h-2.5 w-2.5 text-zinc-600" />
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-500">
                              {t('products.missingCategoryFull')}
                            </span>
                            <Pencil className="h-2.5 w-2.5 text-amber-600" />
                          </>
                        )}
                      </button>
                      {p.is_customizable && (
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-400">
                          Customizable
                        </span>
                      )}
                    </div>
                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 ring-1 ring-zinc-700"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {tags.length > 4 && (
                          <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-700">
                            +{tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 text-sm font-medium text-zinc-300">{priceRange}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                      {images.length === 0 && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                      {images.length === 0 ? (
                        <span className="text-amber-500">{t('products.noImages')}</span>
                      ) : (
                        <span>{t('products.imagesCount', { count: images.length })}</span>
                      )}
                      <span>·</span>
                      <span>
                        {t('products.addedDate')} {formatDate(p.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
                    checked={isSelected}
                    onChange={() => toggleSelect(p.id)}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <ToggleStatusButton productId={p.id} isActive={p.is_active} />
                <ProductActionsDropdown
                  productId={p.id}
                  productName={p.name}
                  productSlug={p.slug}
                  isActive={p.is_active}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {safeProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 py-16 text-center">
          <div className="mb-4 rounded-full bg-zinc-900 p-4 ring-1 ring-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-zinc-500"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          {search || statusFilter || categoryFilter ? (
            <>
              <h3 className="text-lg font-medium text-zinc-200">{t('products.noProductsMatch')}</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">{t('products.adjustFilters')}</p>
              <button
                onClick={() => {
                  setSearchInput('')
                  pushParams({ search: null, status: null, category: null })
                }}
                className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {t('products.clearAllFilters')}
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-zinc-200">{t('products.noProductsFound')}</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">{t('products.noProductsDesc')}</p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                <SyncPrintfulButton />
                <span className="text-xs text-zinc-600 sm:hidden">- OR -</span>
                <Link
                  href="/admin/products/new"
                  className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 sm:w-auto"
                >
                  {t('products.newProduct')}
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bulk Delete Confirmation Dialog ──────────────────────────────────── */}
      {bulkDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-title"
        >
          <div
            ref={bulkDeleteRef}
            className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
          >
            <h2 id="bulk-delete-title" className="text-lg font-semibold text-zinc-50">
              {t('products.deleteProductsTitle', { count: selectedIds.size })}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('products.deleteProductsDesc', { count: selectedIds.size })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(false)}
                disabled={loading !== null}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                {t('dangerZone.cancelDelete')}
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={loading !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading === 'delete'
                  ? t('dangerZone.deleting')
                  : t('dangerZone.deletePermanently')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Picker Dialog ────────────────────────────────────────────── */}
      {pickerTarget && (
        <CategoryPickerDialog
          productId={pickerTarget.id}
          productName={pickerTarget.name}
          currentCategoryId={pickerTarget.categoryId}
          categories={categories}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* ── Pagination Controls ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
          <div>{t('orders.pageOf', { current: currentPage, total: totalPages })}</div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700 disabled:opacity-50"
            >
              {t('customers.previous')}
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700 disabled:opacity-50"
            >
              {t('customers.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
