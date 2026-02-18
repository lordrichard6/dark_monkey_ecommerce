'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { fetchSyncProduct } from '@/lib/printful'

const API_BASE = 'https://api.printful.com'

/**
 * Generates mockups for a given Printful Sync Product ID using the
 * Printful Mockup Generator API (v2/mockup-tasks).
 *
 * Key fix vs previous version:
 * - Uses `file.url` (the actual design file) as the layer source, NOT
 *   `file.preview_url` which is just a thumbnail of the design — the
 *   generator requires the original file URL to render correctly.
 * - Groups by color to avoid creating duplicate tasks for S/M/L of same color.
 * - Saves generated mockup URLs to product_images in Supabase.
 */
export async function generateMockupsForProduct(
  storeProductId: number
): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { success: false, error: 'Database not configured' }

  const token = process.env.PRINTFUL_API_TOKEN
  if (!token) return { success: false, error: 'Missing PRINTFUL_API_TOKEN' }

  // 1. Fetch Sync Product to get print files and catalog IDs
  console.log(`[GenerateMockups] Fetching Sync Product ${storeProductId}...`)
  const syncResult = await fetchSyncProduct(storeProductId)
  if (!syncResult.ok || !syncResult.product) {
    return { success: false, error: syncResult.error ?? 'Failed to fetch sync product' }
  }

  const { sync_product: sp, sync_variants: variants } = syncResult.product

  if (!variants?.length) {
    return { success: false, error: 'Product has no variants' }
  }

  // 2. Group variants by color — one representative per color
  // Printful variant names follow: "Product Name / Color / Size"
  // We pick the first variant per color (usually size S or the first listed)
  const variantsByColor = new Map<string, (typeof variants)[0]>()

  for (const v of variants) {
    // Use sv.color if available (set by sync), otherwise parse from name
    const color =
      (v as unknown as Record<string, string>).color ||
      (() => {
        const parts = (v.product?.name ?? v.name ?? '').split(' / ')
        return parts.length >= 2 ? parts[parts.length - 2].trim() : 'Default'
      })()

    if (!variantsByColor.has(color)) {
      variantsByColor.set(color, v)
    }
  }

  console.log(`[GenerateMockups] ${variantsByColor.size} color(s) to process`)

  // 3. Build mockup task payloads — one task per color
  const productsPayload: object[] = []

  for (const [color, variant] of variantsByColor.entries()) {
    const files =
      (
        variant as unknown as {
          files?: Array<{
            type: string
            url?: string
            preview_url?: string
            thumbnail_url?: string
          }>
        }
      ).files ?? []

    // Find front/default and back files
    // Use file.url (the actual design file) — NOT preview_url which is just a thumbnail
    const frontFile = files.find((f) => f.type === 'default' || f.type === 'front')
    const backFile = files.find((f) => f.type === 'back')

    if (!frontFile?.url && !backFile?.url) {
      console.log(`[GenerateMockups] Skipping ${color}: no print file URLs found`)
      continue
    }

    const placements: object[] = []

    if (frontFile?.url) {
      placements.push({
        placement: 'front',
        technique: 'DTG',
        layers: [{ type: 'file', url: frontFile.url }],
      })
    }

    if (backFile?.url) {
      placements.push({
        placement: 'back',
        technique: 'DTG',
        layers: [{ type: 'file', url: backFile.url }],
      })
    }

    if (placements.length === 0) continue

    productsPayload.push({
      source: 'catalog',
      catalog_product_id: variant.product.product_id,
      catalog_variant_ids: [variant.product.variant_id],
      placements,
      format: 'jpg',
      width: 1000,
    })
  }

  if (productsPayload.length === 0) {
    return {
      success: false,
      message:
        'No valid variants with print file URLs found. Ensure designs are uploaded in Printful.',
    }
  }

  // 4. Submit mockup generation task(s) to Printful
  console.log(`[GenerateMockups] Submitting ${productsPayload.length} task(s) to Printful...`)
  const res = await fetch(`${API_BASE}/v2/mockup-tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products: productsPayload }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[GenerateMockups] Printful API error ${res.status}:`, text)
    return { success: false, error: `Printful API error ${res.status}: ${text}` }
  }

  const data = await res.json()
  const tasks: Array<{ id: number }> = data.data ?? []
  const taskIds = tasks.map((t) => t.id).filter(Boolean)

  if (taskIds.length === 0) {
    console.error('[GenerateMockups] No tasks created:', data)
    return { success: false, error: 'Printful returned no task IDs' }
  }

  console.log(`[GenerateMockups] ${taskIds.length} task(s) created. Polling...`)

  // 5. Poll all tasks concurrently until complete (with exponential backoff)
  const results = await Promise.all(taskIds.map((id) => waitForTask(id, token)))

  // 6. Save results to product_images in Supabase
  const { data: dbProduct } = await supabase
    .from('products')
    .select('id')
    .eq('printful_sync_product_id', storeProductId)
    .single()

  if (!dbProduct?.id) {
    return { success: false, error: 'Product not found in database' }
  }

  // Build reverse lookup: catalog_variant_id → color name
  const variantIdToColor = new Map<number, string>()
  for (const [color, v] of variantsByColor.entries()) {
    variantIdToColor.set(v.product.variant_id, color)
  }

  let savedCount = 0
  for (const result of results) {
    if (!result) continue

    const variantMockups = (result.catalog_variant_mockups ?? []) as Array<{
      catalog_variant_id: number
      mockups: Array<{ mockup_url: string; placement: string }>
    }>

    for (const vm of variantMockups) {
      const color = variantIdToColor.get(vm.catalog_variant_id)
      for (const m of vm.mockups ?? []) {
        if (!m.mockup_url) continue
        const { error } = await supabase.from('product_images').insert({
          product_id: dbProduct.id,
          url: m.mockup_url,
          alt: `${sp.name}${color ? ` - ${color}` : ''} (${m.placement})`,
          color: color ?? null,
          sort_order: 50, // after existing images so they don't displace manual uploads
        })
        if (!error) savedCount++
        else console.error('[GenerateMockups] DB insert error:', error)
      }
    }
  }

  console.log(`[GenerateMockups] Done. ${savedCount} mockup(s) saved.`)
  return { success: true, count: savedCount }
}

// ---------------------------------------------------------------------------
// Poll a single task until completed/failed, with exponential backoff
// ---------------------------------------------------------------------------
async function waitForTask(taskId: number, token: string): Promise<Record<string, unknown> | null> {
  const maxAttempts = 12
  let delay = 2000 // start at 2s — mockup generation takes ~5-15s

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delay))

    try {
      const res = await fetch(`${API_BASE}/v2/mockup-tasks?id=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        console.warn(`[waitForTask] HTTP ${res.status} for task ${taskId}`)
        if (res.status >= 500) {
          delay = Math.min(delay * 1.5, 10000)
          continue
        }
        return null
      }

      const data = await res.json()
      const item = data.data?.[0] as Record<string, unknown> | undefined

      if (item?.status === 'completed') {
        console.log(`[waitForTask] Task ${taskId} completed`)
        return item
      }
      if (item?.status === 'failed') {
        console.error(`[waitForTask] Task ${taskId} failed:`, item.error)
        return null
      }

      // Still pending — continue with backoff
      delay = Math.min(delay * 1.5, 10000)
    } catch (err) {
      console.error(`[waitForTask] Network error for task ${taskId}:`, err)
      delay = Math.min(delay * 1.5, 10000)
    }
  }

  console.error(`[waitForTask] Timeout after ${maxAttempts} attempts for task ${taskId}`)
  return null
}
