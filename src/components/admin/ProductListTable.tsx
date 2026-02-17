'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { ProductActionsDropdown } from '@/app/[locale]/admin/(dashboard)/products/product-actions-dropdown'
import { SyncPrintfulButton } from '@/app/[locale]/admin/(dashboard)/products/sync-printful-button'
import { bulkDeleteProducts, bulkUpdateProductStatus } from '@/actions/admin-products'

type Product = {
  id: string
  name: string
  slug: string
  is_active: boolean
  is_customizable: boolean
  categories: { name: string } | null
  product_images: { id: string; url: string; sort_order?: number }[]
  product_variants: { id: string; price_cents: number }[]
  created_at: string
}

type Props = {
  products: Product[]
  currentPage: number
  totalPages: number
}

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

export function ProductListTable({ products, currentPage, totalPages }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<'status' | 'delete' | null>(null)

  const safeProducts = products || []
  const allSelected = safeProducts.length > 0 && selectedIds.size === safeProducts.length
  const indeterminate = selectedIds.size > 0 && selectedIds.size < safeProducts.length

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

  async function handleBulkDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} products?`)) return
    setLoading('delete')
    const result = await bulkDeleteProducts(Array.from(selectedIds))
    setLoading(null)
    if (result.ok) {
      setSelectedIds(new Set())
      router.refresh()
    } else {
      alert(`Error: ${result.error}`)
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
      alert(`Error: ${result.error}`)
    }
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div>
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 shadow-lg">
          <span className="text-sm text-zinc-300 font-medium">{selectedIds.size} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatus(true)}
              disabled={loading !== null}
              className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              Set Active
            </button>
            <button
              onClick={() => handleBulkStatus(false)}
              disabled={loading !== null}
              className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              Set Inactive
            </button>
            <div className="mx-2 hidden h-4 w-px bg-zinc-600 sm:block" />
            <button
              onClick={handleBulkDelete}
              disabled={loading !== null}
              className="rounded bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
            >
              {loading === 'delete' ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Select All */}
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
          Select All
        </label>
      </div>

      {/* Desktop Table View */}
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
              <th className="w-14 px-4 py-3 text-left text-sm font-medium text-zinc-400"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Images</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Price range</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
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
              const category = p.categories?.name ?? '—'
              const isSelected = selectedIds.has(p.id)

              return (
                <tr
                  key={p.id}
                  className={`border-b border-zinc-800/50 transition-colors ${
                    isSelected ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
                      checked={isSelected}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {thumbnailUrl ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded ring-1 ring-zinc-700">
                          <img
                            src={thumbnailUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500 ring-1 ring-zinc-700">
                          —
                        </div>
                      )}
                    </Link>
                  </td>
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
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {p.categories ? (
                      p.categories.name
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Missing</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{images.length}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{priceRange}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        p.is_active
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
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

      {/* Mobile Card View */}
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
          const category = p.categories?.name ?? '—'
          const isSelected = selectedIds.has(p.id)

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
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-500 ring-1 ring-zinc-700">
                        —
                      </div>
                    )}
                  </Link>
                  <div>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium text-zinc-50 hover:text-amber-400 line-clamp-2"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {p.categories ? (
                        <span className="text-zinc-400">{p.categories.name}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500">
                          <AlertTriangle className="h-3 w-3" />
                          Missing Category
                        </span>
                      )}
                      {p.is_customizable && (
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-400">
                          Customizable
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-medium text-zinc-300">{priceRange}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Added: {formatDate(p.created_at)}
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
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    p.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
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
          <h3 className="text-lg font-medium text-zinc-200">No products found</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Get started by syncing your products from Printful or adding a new product manually.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <SyncPrintfulButton />
            <span className="text-xs text-zinc-600 sm:hidden">- OR -</span>
            <Link
              href="/admin/products/new"
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 sm:w-auto"
            >
              + New product
            </Link>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
