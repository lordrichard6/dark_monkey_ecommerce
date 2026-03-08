'use server'

import { getProductBySlug, getProductCustomizationRule } from '@/lib/queries'
import { sanitizeProductHtml } from '@/lib/sanitize-html.server'

export async function getProductQuickView(slug: string) {
  const { data, error } = await getProductBySlug(slug)

  if (error || !data) {
    return { error: 'Product not found' }
  }

  let customizationRule = null
  if (data.is_customizable) {
    customizationRule = await getProductCustomizationRule(data.id)
  }

  return {
    data: {
      ...data,
      description: sanitizeProductHtml(data.description),
    },
    customizationRule,
  }
}
