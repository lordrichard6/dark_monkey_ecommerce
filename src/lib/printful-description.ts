/**
 * Utilities for processing Printful product descriptions.
 *
 * Printful returns descriptions as plain text using two common patterns:
 *   1. Bullet chars:  "Intro text. • Spec A • Spec B • Spec C Disclaimer."
 *   2. Newline lines: "Intro text.\n• Spec A\n• Spec B"
 *
 * These functions convert that to clean HTML and extract structured data.
 */

const MATERIAL_KEYWORDS = [
  'cotton',
  'polyester',
  'spandex',
  'elastane',
  'nylon',
  'rayon',
  'viscose',
  'modal',
  'bamboo',
  'wool',
  'linen',
  'silk',
  'fleece',
  'jersey',
  'canvas',
  'twill',
  'oz/yd',
  'oz/sq',
  'g/m²',
  'gsm',
  'fabric weight',
]

const MATERIAL_REGEX = new RegExp(MATERIAL_KEYWORDS.join('|'), 'i')

/** True if a bullet item looks like fabric/material specification */
function isMaterialBullet(text: string): boolean {
  return MATERIAL_REGEX.test(text) || /^\d+%\s/.test(text.trim())
}

/**
 * Parse a Printful plain-text description into clean HTML.
 *
 * - Already-HTML descriptions (contain a tag) are returned unchanged.
 * - `•` bullets and newline-separated lines become <ul><li> lists.
 * - Surrounding intro/outro text becomes <p> paragraphs.
 */
export function parsePrintfulDescription(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null

  // Already HTML — don't touch it
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw

  // Normalise: replace " • " (with spaces) and "\n•" with a single separator
  const normalised = raw
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*•\s*/g, '\n•\t')
    .replace(/\s+•\s+/g, '\n•\t')

  const lines = normalised
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const htmlParts: string[] = []
  const bulletBuffer: string[] = []

  function flushBullets() {
    if (bulletBuffer.length === 0) return
    htmlParts.push(`<ul>${bulletBuffer.map((b) => `<li>${b}</li>`).join('')}</ul>`)
    bulletBuffer.length = 0
  }

  for (const line of lines) {
    if (line.startsWith('•\t')) {
      bulletBuffer.push(escapeHtml(line.slice(2).trim()))
    } else {
      flushBullets()
      // Wrap non-bullet lines as paragraphs
      htmlParts.push(`<p>${escapeHtml(line)}</p>`)
    }
  }
  flushBullets()

  return htmlParts.join('')
}

/**
 * Extract material/fabric specification bullets from a Printful description
 * and return them as an HTML list.
 *
 * Returns null if no material-looking bullets are found.
 */
export function extractMaterialInfo(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  if (/<[a-z][\s\S]*>/i.test(raw)) return null // already processed

  const normalised = raw
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*•\s*/g, '\n•\t')
    .replace(/\s+•\s+/g, '\n•\t')

  const bullets = normalised
    .split('\n')
    .filter((l) => l.startsWith('•\t'))
    .map((l) => l.slice(2).trim())
    .filter(isMaterialBullet)

  if (bullets.length === 0) return null
  return `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
}

/**
 * Format a Printful technique key into a readable print method string.
 * e.g. "dtg" → "DTG (Direct to Garment)"
 */
export function formatTechnique(
  techniques: Array<{ key: string; display_name: string; is_default: boolean }> | undefined
): string | null {
  if (!techniques?.length) return null
  // Prefer default technique, otherwise take the first
  const preferred = techniques.find((t) => t.is_default) ?? techniques[0]
  return preferred.display_name
}

/**
 * Format Printful avg_fulfillment_time (decimal days) as a human-readable string.
 * e.g. 2.22 → "2–3 business days"
 */
export function formatFulfillmentTime(days: number | null | undefined): string | null {
  if (days == null) return null
  const low = Math.floor(days)
  const high = Math.ceil(days) + 1
  if (low === high - 1) return `${low}–${high} business days`
  return `${low}–${high} business days`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
