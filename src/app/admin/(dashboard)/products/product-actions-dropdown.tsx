'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  updateProductStatus,
  deleteProduct,
} from '@/actions/admin-products'

type Props = {
  productId: string
  productName: string
  isActive: boolean
}

export function ProductActionsDropdown({
  productId,
  productName,
  productSlug,
  isActive,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState<'status' | 'delete' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  async function handleSetStatus() {
    setLoading('status')
    const result = await updateProductStatus(productId, !isActive)
    setLoading(null)
    setOpen(false)
    if (result.ok) router.refresh()
  }

  async function handleDeleteConfirm() {
    setLoading('delete')
    const result = await deleteProduct(productId)
    setLoading(null)
    setDeleteDialogOpen(false)
    setOpen(false)
    if (result.ok) router.refresh()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-50"
        aria-label="Actions"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
          <Link
            href={`/admin/products/${productId}`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800"
          >
            <ViewIcon className="h-4 w-4" />
            View product
          </Link>
          <Link
            href={`/products/${productSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800"
          >
            <ExternalIcon className="h-4 w-4" />
            View on store
          </Link>
          <button
            type="button"
            onClick={handleSetStatus}
            disabled={loading !== null}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <StatusIcon className="h-4 w-4" />
            {loading === 'status' ? 'Updating…' : isActive ? 'Set inactive' : 'Set active'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteDialogOpen(true)
            }}
            disabled={loading !== null}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 transition hover:bg-zinc-800 hover:text-red-300 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete product
          </button>
        </div>
      )}

      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-zinc-50">
              Delete product
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete &quot;{productName}&quot;? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={loading !== null}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading === 'delete' ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function StatusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v18" />
      <path d="m8 7 4-4 4 4" />
      <path d="m8 17 4 4 4-4" />
    </svg>
  )
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}
