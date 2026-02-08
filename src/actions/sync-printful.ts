'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import {
  fetchStoreProducts,
  fetchSyncProduct,
  fetchCatalogVariant,
  fetchCatalogProduct,
  isPrintfulConfigured,
} from '@/lib/printful'
import { revalidatePath } from 'next/cache'

/** Resolve price in cents: use retail_price, or catalog wholesale * 2.5 as fallback */
async function resolvePriceCents(
  retailPrice: string | undefined,
  catalogVariantId: number
): Promise<number> {
  const retail = parseFloat(retailPrice || '0')
  if (retail > 0) return Math.round(retail * 100)
  const cat = await fetchCatalogVariant(catalogVariantId)
  if (cat.ok && cat.price != null && cat.price > 0) {
    return Math.round(cat.price * 2.5 * 100) // ~2.5x markup from wholesale
  }
  return 3990 // CHF 39.90 default when no price available
}

type SyncProduct = { name: string; thumbnail_url?: string }
type SyncVariant = {
  product?: { name?: string; image?: string }
  files?: Array<{ preview_url?: string; thumbnail_url?: string; type?: string }>
  color?: string
  size?: string
  retail_price?: string
  variant_id?: number
  id?: number
  sku?: string | null
}

async function ensureProductImages(
  supabase: NonNullable<ReturnType<typeof import('@/lib/supabase/admin').getAdminClient>>,
  productId: string,
  sync_product: SyncProduct,
  sync_variants: SyncVariant[]
) {
  /* Optimization: Fetch all existing images once */
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('id, url, color')
    .eq('product_id', productId)

  const existingMap = new Map<string, { id: string, color: string | null }>()
  existingImages?.forEach(img => existingMap.set(img.url, img))

  const seen = new Set<string>()
  let sortOrder = 0
  const toInsert: any[] = []
  const startSortOrder = (existingImages?.length || 0) + 1 // simple increment strategy or reset? 
  // actually existing sortOrder logic was just incrementing from 0. 
  // If we delete all and recreate, 0 is fine.
  // But here we are merging. usage of 'sortOrder' implies we might want to reorder everything?
  // Use simple counter for new items.

  // 1. Add Thumbnail (colorless / default)
  const thumbUrl = sync_product.thumbnail_url || sync_variants[0]?.product?.image
  if (thumbUrl && !seen.has(thumbUrl)) {
    seen.add(thumbUrl)
    const existingImg = existingMap.get(thumbUrl)

    if (!existingImg) {
      toInsert.push({
        product_id: productId,
        url: thumbUrl,
        alt: sync_product.name,
        sort_order: sortOrder++,
        color: null,
      })
    } else {
      // preserve existing sort order? The original code didn't update sort_order of existing.
      // We just increment our local counter to keep relative order of NEW items meaningful?
      // Actually original code reused sortOrder=0 for every product sync run, effectively ignoring existing sort orders.
      // We will stick to the same logic: just increment.
      sortOrder++
    }
  }

  // 2. Add Variant Images (with Color)
  const variantsByColor = new Map<string, typeof sync_variants>()
  for (const sv of sync_variants) {
    const color = sv.color
    if (!color) continue
    if (!variantsByColor.has(color)) variantsByColor.set(color, [])
    variantsByColor.get(color)!.push(sv)
  }

  for (const [color, variants] of variantsByColor.entries()) {
    const allFiles = variants.flatMap(v => v.files || [])
    const previewFile = allFiles.find(f => f.type === 'preview')
    const newestVariant = variants.sort((a, b) => (b.id || 0) - (a.id || 0))[0]
    const allFilesNewest = newestVariant.files || []
    const mainPreviewFile = allFilesNewest.find(f => f.type === 'preview')
    const mainImageToUse = mainPreviewFile?.preview_url ?? mainPreviewFile?.thumbnail_url ?? newestVariant.product?.image

    const imagesToSync = new Set<string>()
    if (mainImageToUse) imagesToSync.add(mainImageToUse)

    const allVariantsFiles = variants.flatMap(v => v.files || [])
    for (const f of allVariantsFiles) {
      if (f.type !== 'preview') continue
      const u = f.preview_url || f.thumbnail_url
      if (u) imagesToSync.add(u)
    }
    for (const v of variants) {
      if (v.product?.image) imagesToSync.add(v.product.image)
    }

    const sortedImages = [
      ...(mainImageToUse ? [mainImageToUse] : []),
      ...Array.from(imagesToSync).filter(u => u !== mainImageToUse)
    ]

    for (const url of sortedImages) {
      if (seen.has(url)) continue;
      seen.add(url)

      const existingImg = existingMap.get(url)

      if (!existingImg) {
        toInsert.push({
          product_id: productId,
          url: url,
          alt: `${sync_product.name} (${color})`,
          sort_order: sortOrder++,
          color,
        })
      } else {
        sortOrder++
        if (color && !existingImg.color) {
          // Update existing image with color if it was missing
          await supabase
            .from('product_images')
            .update({ color })
            .eq('id', existingImg.id)
          // Update logic remains one-by-one but it is rare
        }
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('product_images').insert(toInsert)
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type PrintfulDebugEntry = {
  api: string
  productId?: number
  productName?: string
  raw: unknown
}

export async function syncPrintfulProducts(debug = false): Promise<{
  ok: boolean
  synced?: number
  skipped?: number
  error?: string
  debugLog?: PrintfulDebugEntry[]
}> {
  // Allow CLI bypass if env var is set
  const isCli = process.env.IS_CLI_SYNC === 'true'
  const user = isCli ? { id: 'cli-admin', email: 'cli@example.com' } : await getAdminUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'Printful not configured (PRINTFUL_API_TOKEN)' }
  }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Database not configured' }

  let synced = 0
  let skipped = 0
  let totalFromApi = 0
  let firstError: string | null = null
  let offset = 0
  const limit = 20
  const debugLog: PrintfulDebugEntry[] = []

  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'apparel')
    .single()
  const categoryId = defaultCat?.id ?? null

  while (true) {
    const listRes = await fetchStoreProducts(offset, limit)
    if (debug) {
      debugLog.push({
        api: 'GET store/products',
        raw: { offset, limit, ok: listRes.ok, total: listRes.total, products: listRes.products, error: listRes.error },
      })
    }
    if (!listRes.ok) {
      return { ok: false, error: listRes.error ?? 'Printful API error', debugLog: debug ? debugLog : undefined }
    }
    if (!listRes.products?.length) {
      if (offset === 0) {
        return {
          ok: true,
          synced: 0,
          skipped: 0,
          error:
            'No products in your Printful store. Add products at my.printful.com (Store → Add product). The sync only imports products from a Manual/API store.',
        }
      }
      break
    }
    if (offset === 0) totalFromApi = listRes.total ?? 0

    for (const pf of listRes.products) {
      const detailRes = await fetchSyncProduct(pf.id)
      if (debug) {
        debugLog.push({
          api: 'GET store/products/:id',
          productId: pf.id,
          productName: pf.name,
          raw: detailRes,
        })
      }
      if (!detailRes.ok || !detailRes.product?.sync_variants?.length) {
        if (detailRes.error && !firstError) firstError = `Printful API: ${detailRes.error}`
        skipped++
        continue
      }

      const { sync_product, sync_variants } = detailRes.product

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('printful_sync_product_id', sync_product.id)
        .single()

      let productId: string

      if (existing?.id) {
        productId = existing.id
        // Restore product if it was soft-deleted, and ensure it's active
        await supabase
          .from('products')
          .update({ deleted_at: null, is_active: true })
          .eq('id', productId)

        await ensureProductImages(supabase, productId, sync_product, sync_variants)
      } else {
        let slug = slugify(sync_product.name)
        let n = 0
        while (true) {
          const { data: slugTaken } = await supabase
            .from('products')
            .select('id')
            .eq('slug', slug)
            .single()
          if (!slugTaken) break
          slug = `${slugify(sync_product.name)}-${++n}`
        }

        let description: string | null = null
        const catalogProductId = sync_variants[0]?.product?.product_id
        if (catalogProductId != null) {
          const catalog = await fetchCatalogProduct(catalogProductId)
          if (catalog.ok && catalog.description?.trim()) {
            description = catalog.description.trim()
          }
        }

        const { data: inserted, error: insertErr } = await supabase
          .from('products')
          .insert({
            category_id: categoryId,
            name: sync_product.name,
            slug,
            description,
            is_customizable: false,
            is_active: true,
            printful_sync_product_id: sync_product.id,
          })
          .select('id')
          .single()

        if (insertErr || !inserted?.id) {
          if (insertErr && !firstError) firstError = insertErr.message
          skipped++
          continue
        }
        productId = inserted.id
        synced++

        await ensureProductImages(supabase, productId, sync_product, sync_variants)
      }

      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id, printful_sync_variant_id, price_cents')
        .eq('product_id', productId)
      const existingPfIds = new Set(
        (existingVariants ?? []).map((v) => v.printful_sync_variant_id).filter((id): id is number => id != null)
      )
      const existingByPfId = new Map(
        (existingVariants ?? [])
          .filter((v): v is typeof v & { printful_sync_variant_id: number } => v.printful_sync_variant_id != null)
          .map((v) => [v.printful_sync_variant_id, v])
      )

      for (let i = 0; i < sync_variants.length; i++) {
        const sv = sync_variants[i]
        const priceCents = await resolvePriceCents(sv.retail_price, sv.variant_id)
        const attrs: Record<string, string> = {}
        if (sv.size) attrs.size = sv.size
        if (sv.color) attrs.color = sv.color

        const existingVar = existingByPfId.get(sv.id)
        if (existingVar) {
          if (existingVar.price_cents === 0) {
            await supabase
              .from('product_variants')
              .update({ price_cents: priceCents, attributes: attrs })
              .eq('id', existingVar.id)
          }
          continue
        }

        const { data: newVar, error: varErr } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: sv.sku ?? null,
            name: sv.product?.name ?? `${sync_product.name} variant`,
            price_cents: priceCents,
            attributes: attrs,
            sort_order: i + 1,
            printful_sync_variant_id: sv.id,
            printful_variant_id: sv.variant_id ?? null,
          })
          .select('id')
          .single()

        if (newVar?.id) {
          await supabase.from('product_inventory').upsert(
            { variant_id: newVar.id, quantity: 999 },
            { onConflict: 'variant_id' }
          )
          synced++
        } else if (varErr && !firstError) {
          firstError = `Variant: ${varErr.message}`
        }
      }
    }

    offset += limit
    if (listRes.products.length < limit) break
  }

  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
  const message =
    synced > 0
      ? `Synced ${synced} items`
      : firstError
        ? `Sync failed: ${firstError}`
        : totalFromApi > 0
          ? `All ${totalFromApi} Printful products already in store (nothing new to sync)`
          : undefined
  return {
    ok: true,
    synced,
    skipped,
    error: message,
    ...(debug && { debugLog }),
  }
}
