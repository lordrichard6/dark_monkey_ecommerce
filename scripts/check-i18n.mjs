#!/usr/bin/env node
/**
 * check-i18n.mjs
 *
 * Compares all locale JSON files under messages/ against the English reference.
 * Exits with code 1 if any locale is missing keys that exist in en.json.
 *
 * Usage:
 *   node scripts/check-i18n.mjs
 *   node scripts/check-i18n.mjs --warn   # exit 0 but print warnings
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(__dirname, '..', 'messages')
const warnOnly = process.argv.includes('--warn')

function flatten(obj, prefix = '') {
  const keys = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const nested of flatten(v, full)) keys.add(nested)
    } else {
      keys.add(full)
    }
  }
  return keys
}

const files = readdirSync(messagesDir).filter((f) => f.endsWith('.json'))
const enKeys = flatten(JSON.parse(readFileSync(join(messagesDir, 'en.json'), 'utf8')))

let totalMissing = 0
let hasError = false

for (const file of files) {
  if (file === 'en.json') continue
  const lang = file.replace('.json', '').toUpperCase()
  const keys = flatten(JSON.parse(readFileSync(join(messagesDir, file), 'utf8')))
  const missing = [...enKeys].filter((k) => !keys.has(k))

  if (missing.length > 0) {
    totalMissing += missing.length
    hasError = true
    console.error(`\n❌ ${lang}: ${missing.length} missing key(s)`)
    for (const key of missing.sort()) {
      console.error(`   - ${key}`)
    }
  } else {
    console.log(`✅ ${lang}: all ${keys.size} keys present`)
  }
}

if (hasError) {
  console.error(`\n${warnOnly ? '⚠️  Warning' : '❌ Error'}: ${totalMissing} total missing translation key(s) found.`)
  if (!warnOnly) {
    console.error('Run translations before merging. Exiting with code 1.')
    process.exit(1)
  }
} else {
  console.log(`\n✅ All locales are complete (${enKeys.size} keys each).`)
}
