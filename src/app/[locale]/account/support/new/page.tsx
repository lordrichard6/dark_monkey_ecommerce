'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { createTicket } from '@/actions/support'
import type { TicketCategory } from '@/actions/support'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'

const CATEGORIES: TicketCategory[] = ['order_issue', 'complaint', 'suggestion', 'question']

export default function NewTicketPage() {
  const t = useTranslations('support')
  const [category, setCategory] = useState<TicketCategory>('question')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const subject = (formData.get('subject') as string).trim()
    const message = (formData.get('message') as string).trim()

    if (!subject || !message) {
      setError('Subject and message are required.')
      return
    }

    startTransition(async () => {
      // createTicket redirects on success; on error it returns a value
      const result = await createTicket(subject, category, message)
      if (result && !result.ok) {
        setError(result.error ?? 'Failed to submit ticket.')
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/account/support"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToTickets')}
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-zinc-50">{t('newTicket')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-zinc-300 mb-1.5">
            {t('subject')}
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            placeholder={t('subjectPlaceholder')}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        {/* Category */}
        <div>
          <p className="block text-sm font-medium text-zinc-300 mb-2">{t('category')}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  category === cat
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {t(`cat_${cat}` as `cat_${TicketCategory}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-1.5">
            {t('message')}
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            placeholder={t('messagePlaceholder')}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? '…' : t('submit')}
        </button>
      </form>
    </div>
  )
}
