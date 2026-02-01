export type CustomizationField =
  | {
      key: string
      type: 'text'
      label: string
      placeholder?: string
      maxLength?: number
      priceModifierCents?: number
    }
  | {
      key: string
      type: 'select'
      label: string
      options: Array<{ value: string; label: string; priceModifierCents?: number }>
    }

export type CustomizationRuleDef = {
  fields: CustomizationField[]
}

export function getPriceModifierFromConfig(
  ruleDef: CustomizationRuleDef,
  config: Record<string, unknown>
): number {
  let total = 0
  for (const field of ruleDef.fields) {
    const value = config[field.key]
    if (value == null || value === '') continue
    if (field.type === 'text' && 'priceModifierCents' in field) {
      total += field.priceModifierCents ?? 0
    }
    if (field.type === 'select') {
      const opt = field.options.find((o) => o.value === value)
      if (opt?.priceModifierCents) total += opt.priceModifierCents
    }
  }
  return total
}
