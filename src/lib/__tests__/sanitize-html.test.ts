import { describe, it, expect } from 'vitest'
import { sanitizeProductHtml } from '../sanitize-html.server'

describe('sanitizeProductHtml', () => {
  it('returns empty string for null', () => {
    expect(sanitizeProductHtml(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(sanitizeProductHtml(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(sanitizeProductHtml('')).toBe('')
  })

  it('strips script tags (XSS prevention)', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>'
    const output = sanitizeProductHtml(input)
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('alert')
    expect(output).toContain('<p>Hello</p>')
  })

  it('strips event handlers (XSS prevention)', () => {
    const input = '<p onclick="alert(1)">Click me</p>'
    const output = sanitizeProductHtml(input)
    expect(output).not.toContain('onclick')
    expect(output).toContain('Click me')
  })

  it('allows safe tags: p, strong, em, ul, li', () => {
    const input = '<p>Text <strong>bold</strong> and <em>italic</em></p><ul><li>Item</li></ul>'
    const output = sanitizeProductHtml(input)
    expect(output).toContain('<p>')
    expect(output).toContain('<strong>')
    expect(output).toContain('<em>')
    expect(output).toContain('<ul>')
    expect(output).toContain('<li>')
  })

  it('allows safe tags: h1-h4, blockquote, a, img', () => {
    const input = '<h1>Title</h1><h2>Sub</h2><blockquote>Quote</blockquote>'
    const output = sanitizeProductHtml(input)
    expect(output).toContain('<h1>')
    expect(output).toContain('<h2>')
    expect(output).toContain('<blockquote>')
  })

  it('forces external links to open in a new tab safely', () => {
    const input = '<a href="https://example.com">External</a>'
    const output = sanitizeProductHtml(input)
    expect(output).toContain('target="_blank"')
    expect(output).toContain('rel="noopener noreferrer"')
  })

  it('does not add target/_blank to internal links', () => {
    const input = '<a href="/products/example">Internal</a>'
    const output = sanitizeProductHtml(input)
    expect(output).not.toContain('target="_blank"')
  })

  it('strips iframe tags', () => {
    const input = '<p>Text</p><iframe src="https://evil.com"></iframe>'
    const output = sanitizeProductHtml(input)
    expect(output).not.toContain('<iframe>')
    expect(output).toContain('Text')
  })

  it('strips javascript: from href attributes (XSS prevention)', () => {
    const input = '<a href="javascript:alert(1)">Click me</a>'
    const output = sanitizeProductHtml(input)
    // sanitize-html strips javascript: from href
    expect(output).not.toContain('javascript:')
  })

  it('preserves class attribute', () => {
    const input = '<p class="highlight">Text</p>'
    const output = sanitizeProductHtml(input)
    expect(output).toContain('class="highlight"')
  })

  it('preserves img src and alt attributes', () => {
    const input = '<img src="https://cdn.example.com/img.jpg" alt="Product" />'
    const output = sanitizeProductHtml(input)
    expect(output).toContain('src="https://cdn.example.com/img.jpg"')
    expect(output).toContain('alt="Product"')
  })
})
