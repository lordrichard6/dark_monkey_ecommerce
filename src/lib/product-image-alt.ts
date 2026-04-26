/**
 * Build SEO-friendly alt text for a product image.
 *
 * Priority:
 *   1. Stored alt (admin-provided, most specific)
 *   2. Product name + category + brand
 *   3. Product name + brand
 *
 * Keeps alt under ~125 chars (screen-reader friendly, also Google's soft cap).
 */
export function buildProductImageAlt(
  productName: string,
  storedAlt?: string | null,
  categoryName?: string | null
): string {
  const trimmed = storedAlt?.trim()
  if (trimmed && trimmed.length > 0 && trimmed.toLowerCase() !== productName.toLowerCase()) {
    return trimmed.slice(0, 125)
  }

  const parts = [productName.trim()]
  if (categoryName && categoryName.trim()) parts.push(categoryName.trim())
  parts.push('Dark Monkey')

  return parts.join(' — ').slice(0, 125)
}
