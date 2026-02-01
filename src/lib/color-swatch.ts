/** Common color names to hex for admin swatches */
const COLOR_HEX: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  blue: '#0000ff',
  navy: '#000080',
  green: '#008000',
  olive: '#808000',
  lime: '#00ff00',
  teal: '#008080',
  aqua: '#00ffff',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  maroon: '#800000',
  purple: '#800080',
  fuchsia: '#ff00ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  charcoal: '#36454f',
  ash: '#b2beb5',
  cream: '#fffdd0',
  beige: '#f5f5dc',
  burgundy: '#800020',
  forest: '#228b22',
  mustard: '#ffdb58',
  gold: '#ffd700',
  lilac: '#c8a2c8',
  lavender: '#e6e6fa',
  mint: '#98ff98',
  peach: '#ffcba4',
  sand: '#c2b280',
  steel: '#71797e',
  wine: '#722f37',
}

export function colorToHex(name: string): string {
  const key = name.toLowerCase().trim()
  return COLOR_HEX[key] ?? `#${(key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 0xffffff).toString(16).padStart(6, '0')}`
}
