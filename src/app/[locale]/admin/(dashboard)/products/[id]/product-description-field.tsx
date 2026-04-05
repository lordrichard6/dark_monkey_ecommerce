'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { updateProduct } from '@/actions/admin-products'

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded border border-zinc-700 bg-zinc-800/40 animate-pulse" />
    ),
  }
)

type Lang = 'en' | 'pt' | 'de'

const LANGS: { key: Lang; label: string; flag: string }[] = [
  { key: 'en', label: 'English', flag: '🇬🇧' },
  { key: 'pt', label: 'Português', flag: '🇵🇹' },
  { key: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

type Props = {
  productId: string
  description: string | null
  descriptionTranslations: Record<string, string> | null
}

export function ProductDescriptionField({
  productId,
  description,
  descriptionTranslations,
}: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<Lang>('en')
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<Record<Lang, string>>({
    en: description ?? '',
    pt: descriptionTranslations?.pt ?? '',
    de: descriptionTranslations?.de ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getDisplayValue(lang: Lang): string | null {
    if (lang === 'en') return description
    return descriptionTranslations?.[lang] ?? null
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    let result
    if (activeTab === 'en') {
      result = await updateProduct(productId, { description: values.en.trim() || null })
    } else {
      const existing = descriptionTranslations ?? {}
      const updated: Record<string, string> = { ...existing }
      const val = values[activeTab].trim()
      if (val) {
        updated[activeTab] = val
      } else {
        delete updated[activeTab]
      }
      result = await updateProduct(productId, { description_translations: updated })
    }

    setLoading(false)
    if (result.ok) {
      setEditing(false)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  function handleTabSwitch(lang: Lang) {
    setActiveTab(lang)
    setEditing(false)
    setError(null)
    setValues((prev) => ({
      ...prev,
      [lang]: lang === 'en' ? (description ?? '') : (descriptionTranslations?.[lang] ?? ''),
    }))
  }

  const displayValue = getDisplayValue(activeTab)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {t('fields.description')}
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            {t('fields.edit')}
          </button>
        )}
      </div>

      {/* Language tabs */}
      <div className="mb-4 flex gap-1 border-b border-zinc-800">
        {LANGS.map((lang) => {
          const hasContent =
            lang.key === 'en' ? !!description : !!descriptionTranslations?.[lang.key]
          return (
            <button
              key={lang.key}
              type="button"
              onClick={() => handleTabSwitch(lang.key)}
              className={`relative flex items-center gap-1.5 px-3 pb-2.5 text-xs font-semibold transition ${
                activeTab === lang.key ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {hasContent && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Has content" />
              )}
              {activeTab === lang.key && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-amber-400" />
              )}
            </button>
          )
        })}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <RichTextEditor
            value={values[activeTab]}
            onChange={(v) => setValues((prev) => ({ ...prev, [activeTab]: v }))}
            minHeight="200px"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? t('fields.saving') : t('fields.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setValues((prev) => ({
                  ...prev,
                  [activeTab]:
                    activeTab === 'en'
                      ? (description ?? '')
                      : (descriptionTranslations?.[activeTab] ?? ''),
                }))
                setError(null)
              }}
              disabled={loading}
              className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              {t('fields.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer rounded px-2 py-1 hover:bg-zinc-800/80"
          title={t('fields.clickToEdit')}
        >
          {displayValue ? (
            <div dangerouslySetInnerHTML={{ __html: displayValue }} className="admin-rich-text" />
          ) : (
            <span className="italic text-zinc-500 text-sm">
              {activeTab === 'en'
                ? t('fields.noDescription')
                : `No ${LANGS.find((l) => l.key === activeTab)?.label} description — click to add`}
            </span>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
