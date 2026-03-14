'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { deleteProduct } from '@/actions/admin-products'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

type Props = {
  productId: string
  productName: string
}

export function ProductDangerZone({ productId, productName }: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // Require the user to type the product name to confirm
  const [confirmInput, setConfirmInput] = useState('')

  const confirmed = confirmInput.trim() === productName.trim()

  async function handleDelete() {
    if (!confirmed) return
    setLoading(true)
    const result = await deleteProduct(productId)
    setLoading(false)
    if (result.ok) {
      toast.success(t('dangerZone.productDeleted'))
      router.push('/admin/products')
    } else {
      toast.error(result.error ?? t('dangerZone.failedToDelete'))
      setOpen(false)
    }
  }

  return (
    <>
      {/* ── Danger Zone Card ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-red-900/40 bg-zinc-900/50">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500">
              {t('dangerZone.title')}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">{t('dangerZone.description')}</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/60 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            {t('dangerZone.deleteProduct')}
          </button>
        </div>
      </div>

      {/* ── Confirmation Dialog ───────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
            {/* Red top bar */}
            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-red-800 via-red-600 to-red-500" />

            <div className="p-6">
              {/* Icon + title */}
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-950/60 ring-1 ring-red-800/50">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 id="delete-product-title" className="text-base font-semibold text-zinc-50">
                    {t('dangerZone.deleteProductTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {t('dangerZone.deleteProductDesc', { name: productName })}
                  </p>
                </div>
              </div>

              {/* Confirm by typing name */}
              <div className="mt-5">
                <label className="text-xs font-medium text-zinc-400">
                  {t('dangerZone.typeToConfirm')}{' '}
                  <span className="font-mono text-zinc-200">{productName}</span>
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && confirmed) handleDelete()
                    if (e.key === 'Escape') setOpen(false)
                  }}
                  autoFocus
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600/60 focus:outline-none focus:ring-1 focus:ring-red-600/40"
                  placeholder={productName}
                />
              </div>

              {/* Actions */}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setConfirmInput('')
                  }}
                  disabled={loading}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {t('dangerZone.cancelDelete')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!confirmed || loading}
                  className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('dangerZone.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t('dangerZone.deletePermanently')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
