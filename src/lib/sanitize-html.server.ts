/**
 * Server-side HTML sanitization utility.
 *
 * Uses `sanitize-html` to strip dangerous tags/attributes before HTML is
 * passed from server components to client components via props or rendered
 * with dangerouslySetInnerHTML.
 *
 * IMPORTANT: This file is server-only. Do NOT import it from client components.
 * Sanitize HTML in server components / page.tsx, then pass the clean string down.
 */

import sanitizeHtml from 'sanitize-html'

/** Allowed tags for rich product/story content (paragraphs, lists, emphasis, etc.) */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
  'div',
  'hr',
]

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height', 'loading'],
  '*': ['class', 'style'],
}

/**
 * Sanitize HTML for safe rendering in product descriptions and story bodies.
 * Strips script tags, event handlers, and other dangerous content.
 */
export function sanitizeProductHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    // Force external links to open safely
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.href?.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {}),
        },
      }),
    },
  })
}
