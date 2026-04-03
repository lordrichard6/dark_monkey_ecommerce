'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import type { CustomProductRequest, ArticleType } from '@/actions/custom-products'
import { submitChangeRequest, makeCustomProductPublic } from '@/actions/custom-products'
import { ARTICLE_PRICES_CENTS } from '@/actions/custom-products'
import { ShoppingCart, RefreshCw, Globe, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending: {
    label: 'Pending Review',
    classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  in_review: { label: 'In Review', classes: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
  ready: { label: 'Ready', classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  rejected: { label: 'Rejected', classes: 'border-red-500/30 bg-red-500/10 text-red-400' },
}

const ARTICLE_LABELS: Record<ArticleType, string> = {
  tshirt: 'T-Shirt',
  hoodie: 'Hoodie',
  sweatshirt: 'Sweatshirt',
  cap: 'Cap',
  tote_bag: 'Tote Bag',
  mug: 'Mug',
  phone_case: 'Phone Case',
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function RequestCard({ request, userId }: { request: CustomProductRequest; userId: string }) {
  const t = useTranslations('customize')
  const locale = useLocale()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [changeNote, setChangeNote] = useState('')
  const [showChangeForm, setShowChangeForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = STATUS_STYLES[request.status] ?? STATUS_STYLES.pending
  const articleLabel = ARTICLE_LABELS[request.article_type as ArticleType] ?? request.article_type
  const estimatedPrice = ARTICLE_PRICES_CENTS[request.article_type as ArticleType]
  const isFreeChange = request.change_count === 0

  const handleChangeRequest = async () => {
    if (!changeNote.trim()) return
    setLoading(true)
    setError(null)
    const result = await submitChangeRequest({ requestId: request.id, note: changeNote, locale })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    if (result.free) {
      setShowChangeForm(false)
      setChangeNote('')
      router.refresh()
    } else {
      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl
    }
  }

  const handleMakePublic = async () => {
    setLoading(true)
    const result = await makeCustomProductPublic(request.id)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Failed')
      return
    }
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          {/* Images preview */}
          {request.images.length > 0 && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10">
              <Image src={request.images[0]} alt="Design" fill className="object-cover" />
              {request.images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                  +{request.images.length - 1}
                </div>
              )}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">{articleLabel}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-sm capitalize text-zinc-400">{request.art_style}</span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{request.description}</p>
            <p className="mt-1 text-xs text-zinc-600">
              {new Date(request.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {estimatedPrice && (
                <span className="ml-2 text-amber-500/70">Est. {formatPrice(estimatedPrice)}</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded((p) => !p)}
          className="shrink-0 rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-5">
          {/* All images */}
          {request.images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {request.images.map((url, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10"
                >
                  <Image src={url} alt={`Design ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-zinc-300 leading-relaxed">{request.description}</p>

          {/* Admin note */}
          {request.admin_note && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                Note from our team
              </p>
              <p className="text-sm text-zinc-300">{request.admin_note}</p>
            </div>
          )}

          {/* Actions — only when ready */}
          {request.status === 'ready' && request.product_id && (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/products/${request.product_id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:from-amber-400 hover:to-amber-500"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('buyBtn')}
              </Link>

              <button
                type="button"
                onClick={() => setShowChangeForm((p) => !p)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                {isFreeChange ? t('requestChangeFree') : t('requestChangePaid')}
              </button>

              <button
                type="button"
                onClick={handleMakePublic}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                {t('makePublicBtn')}
              </button>
            </div>
          )}

          {/* Change request form */}
          {showChangeForm && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-800/60 p-4">
              <p className="text-xs text-zinc-400">
                {isFreeChange ? t('changeFormFreeNote') : t('changeFormPaidNote')}
              </p>
              <textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                rows={3}
                placeholder={t('changeNotePlaceholder')}
                className="block w-full resize-none rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleChangeRequest}
                  disabled={loading || !changeNote.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isFreeChange ? t('submitChangeFree') : t('submitChangePaid')}
                </button>
                <button
                  onClick={() => setShowChangeForm(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MyCustomRequests({
  requests,
  userId,
}: {
  requests: CustomProductRequest[]
  userId: string
}) {
  const t = useTranslations('customize')

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('myRequestsTitle')}</h2>
      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} userId={userId} />
        ))}
      </div>
    </section>
  )
}
