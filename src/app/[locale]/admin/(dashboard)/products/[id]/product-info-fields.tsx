'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateProduct } from '@/actions/admin-products'
import { updateStoreSetting } from '@/actions/admin-shipping'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded border border-zinc-700 bg-zinc-800/40 animate-pulse" />
    ),
  }
)

type Props = {
  productId: string
  materialInfo: string | null
  careInstructions: string | null
  printMethod: string | null
  sizeGuideUrl: string | null
  shipmentInfo: string | null
  gpsrInfo: string | null
}

export function ProductInfoFields({
  productId,
  materialInfo: initialMaterial,
  careInstructions: initialCare,
  printMethod: initialPrintMethod,
  sizeGuideUrl: initialSizeGuideUrl,
  shipmentInfo: initialShipment,
  gpsrInfo: initialGpsr,
}: Props) {
  const router = useRouter()
  const t = useTranslations('admin')

  return (
    <div className="space-y-6">
      <TextField
        label={t('fields.printMethod')}
        hint={t('fields.printMethodHint')}
        initialValue={initialPrintMethod ?? ''}
        onSave={(val) =>
          updateProduct(productId, { print_method: val || null }).then((r) => {
            if (r.ok) router.refresh()
            return r
          })
        }
      />

      <TextField
        label={t('fields.sizeGuideUrl')}
        hint={t('fields.sizeGuideHint')}
        initialValue={initialSizeGuideUrl ?? ''}
        onSave={(val) =>
          updateProduct(productId, { size_guide_url: val || null }).then((r) => {
            if (r.ok) router.refresh()
            return r
          })
        }
      />

      <RichField
        label={t('fields.materialInfo')}
        hint={t('fields.materialInfoHint')}
        initialValue={initialMaterial ?? ''}
        onSave={(val) =>
          updateProduct(productId, { material_info: val || null }).then((r) => {
            if (r.ok) router.refresh()
            return r
          })
        }
      />

      <RichField
        label={t('fields.careInstructions')}
        hint={t('fields.careInstructionsHint')}
        initialValue={initialCare ?? ''}
        onSave={(val) =>
          updateProduct(productId, { care_instructions: val || null }).then((r) => {
            if (r.ok) router.refresh()
            return r
          })
        }
      />

      <div className="border-t border-zinc-800 pt-6">
        <p className="mb-4 text-xs text-zinc-500 uppercase tracking-wider font-bold">
          {t('fields.storeWide')}
        </p>
        <div className="space-y-6">
          <RichField
            label={t('fields.shipmentInfo')}
            hint={t('fields.shipmentInfoHint')}
            initialValue={initialShipment ?? ''}
            onSave={(val) => updateStoreSetting('shipment_info', val || '')}
          />
          <RichField
            label={t('fields.gpsrInfo')}
            hint={t('fields.gpsrInfoHint')}
            initialValue={initialGpsr ?? ''}
            onSave={(val) => updateStoreSetting('gpsr_info', val || '')}
          />
        </div>
      </div>
    </div>
  )
}

function TextField({
  label,
  hint,
  initialValue,
  onSave,
}: {
  label: string
  hint?: string
  initialValue: string
  onSave: (val: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const t = useTranslations('admin')
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const dirty = value !== initialValue

  async function handleSave() {
    setLoading(true)
    const result = await onSave(value)
    setLoading(false)
    if (result.ok) {
      toast.success(t('fields.saved', { label }))
    } else {
      toast.error(result.error ?? t('fields.saveFailed'))
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-zinc-600">{hint}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !dirty}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
        >
          {loading ? t('fields.saving') : t('fields.save')}
        </button>
      </div>
    </div>
  )
}

function RichField({
  label,
  hint,
  initialValue,
  onSave,
}: {
  label: string
  hint?: string
  initialValue: string
  onSave: (val: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const t = useTranslations('admin')
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const result = await onSave(value)
    setLoading(false)
    if (result.ok) {
      toast.success(t('fields.saved', { label }))
      setEditing(false)
    } else {
      toast.error(result.error ?? t('fields.saveFailed'))
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </label>
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
      {hint && <p className="mb-2 text-xs text-zinc-600">{hint}</p>}
      {editing ? (
        <div className="flex flex-col gap-2">
          <RichTextEditor value={value} onChange={setValue} minHeight="150px" />
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
                setValue(initialValue)
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
          {value ? (
            <div
              dangerouslySetInnerHTML={{ __html: value }}
              className="admin-rich-text text-sm text-zinc-400"
            />
          ) : (
            <span className="italic text-zinc-500 text-sm">{t('fields.noneClickToAdd')}</span>
          )}
        </div>
      )}
    </div>
  )
}
