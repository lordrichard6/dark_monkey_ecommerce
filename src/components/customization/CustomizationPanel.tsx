'use client'

import type { CustomizationRuleDef, CustomizationField } from '@/types/customization'

type Props = {
  ruleDef: CustomizationRuleDef
  config: Record<string, string>
  onChange: (config: Record<string, string>) => void
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: CustomizationField
  value: string
  onChange: (v: string) => void
}) {
  if (field.type === 'text') {
    return (
      <div>
        <label className="block text-sm font-medium text-zinc-300">{field.label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
        {field.maxLength && (
          <p className="mt-1 text-xs text-zinc-500">
            {value.length}/{field.maxLength} characters
          </p>
        )}
        {field.priceModifierCents && field.priceModifierCents > 0 && (
          <p className="mt-1 text-xs text-amber-400/80">
            +{new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(field.priceModifierCents / 100)} for customization
          </p>
        )}
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-zinc-300">{field.label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.priceModifierCents ? ` (+CHF ${(opt.priceModifierCents / 100).toFixed(2)})` : ''}
            </option>
          ))}
        </select>
      </div>
    )
  }
  return null
}

export function CustomizationPanel({ ruleDef, config, onChange }: Props) {
  return (
    <div className="space-y-4 rounded-lg border border-amber-900/40 bg-amber-950/20 p-4">
      <p className="text-sm font-medium text-amber-200/90">Customize this product</p>
      {ruleDef.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={config[field.key] ?? ''}
          onChange={(v) => onChange({ ...config, [field.key]: v })}
        />
      ))}
    </div>
  )
}
