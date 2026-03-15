import { describe, it, expect } from 'vitest'
import { colorToHex } from '../color-swatch'

describe('lib/color-swatch', () => {
  describe('colorToHex', () => {
    it('returns hex for known color name', () => {
      expect(colorToHex('black')).toBe('#000000')
      expect(colorToHex('white')).toBe('#ffffff')
      expect(colorToHex('red')).toBe('#ff0000')
    })

    it('is case-insensitive', () => {
      expect(colorToHex('Black')).toBe('#000000')
      expect(colorToHex('WHITE')).toBe('#ffffff')
      expect(colorToHex('NAVY')).toBe('#000080')
    })

    it('trims whitespace', () => {
      expect(colorToHex('  blue  ')).toBe('#0000ff')
    })

    it('returns a hex string for unknown color names (hash fallback)', () => {
      const result = colorToHex('unknownColorXYZ')
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('returns gray fallback for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(colorToHex(null as any)).toBe('#808080')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(colorToHex(undefined as any)).toBe('#808080')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(colorToHex(42 as any)).toBe('#808080')
    })

    it('returns hex for multi-word Printful color', () => {
      expect(colorToHex('irish green')).toBe('#009a44')
      expect(colorToHex('sport grey')).toBe('#a9a9a9')
      expect(colorToHex('carolina blue')).toBe('#99badd')
    })

    it('returns consistent hex for same unknown color', () => {
      const first = colorToHex('foobar')
      const second = colorToHex('foobar')
      expect(first).toBe(second)
    })
  })
})
