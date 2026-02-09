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

/** Resolve variant details: price, color codes, etc. */
async function resolveCatalogDetails(
  retailPrice: string | undefined,
  catalogVariantId: number
): Promise<{ priceCents: number; rrpCents: number; colorCode?: string; colorCode2?: string }> {
  const retail = parseFloat(retailPrice || '0')
  const details = await fetchCatalogVariant(catalogVariantId)

  let priceCents = retail > 0 ? Math.round(retail * 100) : 3990
  let rrpCents = priceCents
  let colorCode: string | undefined
  let colorCode2: string | undefined

  if (details.ok && details.variant) {
    const wholesale = parseFloat(details.variant.price || '0')
    if (wholesale > 0) {
      rrpCents = Math.round(wholesale * 2.5 * 100)
    }
    if (retail <= 0 && wholesale > 0) {
      priceCents = rrpCents
    }
    colorCode = details.variant.color_code
    colorCode2 = details.variant.color_code2
  }

  return { priceCents, rrpCents, colorCode, colorCode2 }
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
  // 1. Identify "Keeper" URLs
  const keepers = new Map<string, string | null>() // url -> color

  // A. Main Thumbnail
  const thumbUrl = sync_product.thumbnail_url || sync_variants[0]?.product?.image
  if (thumbUrl) keepers.set(thumbUrl, null)

  // B. One beauty shot per unique color
  const variantsByColor = new Map<string, typeof sync_variants>()
  for (const sv of sync_variants) {
    if (sv.color) {
      if (!variantsByColor.has(sv.color)) variantsByColor.set(sv.color, [])
      variantsByColor.get(sv.color)!.push(sv)
    }
  }

  for (const [color, variants] of variantsByColor.entries()) {
    const newestVariant = variants.sort((a, b) => (b.id || 0) - (a.id || 0))[0]
    const mainPreviewFile = (newestVariant.files || []).find(f => f.type === 'preview')
    const mainImageToUse = mainPreviewFile?.preview_url ?? mainPreviewFile?.thumbnail_url ?? newestVariant.product?.image

    if (mainImageToUse) {
      keepers.set(mainImageToUse, color)
    }
  }

  // 2. Fetch existing images to identify what to delete vs keep
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('id, url')
    .eq('product_id', productId)

  const existingUrls = new Set((existingImages || []).map(img => img.url))

  // 3. Purge redundant Printful images
  // We delete images that: 1. Belong to this product. 2. Are from Printful. 3. Are NOT in our keeper set.
  const toDelete = (existingImages || [])
    .filter(img => img.url.includes('printful.com') && !keepers.has(img.url))
    .map(img => img.id)

  if (toDelete.length > 0) {
    await supabase.from('product_images').delete().in('id', toDelete)
  }

  // 4. Insert missing keepers
  const toInsert = Array.from(keepers.entries())
    .filter(([url]) => !existingUrls.has(url))
    .map(([url, color], index) => ({
      product_id: productId,
      url,
      alt: color ? `${sync_product.name} (${color})` : sync_product.name,
      sort_order: index,
      color,
    }))

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

export async function syncPrintfulProducts(debug = false, onlyLatest = false): Promise<{
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
  const limit = onlyLatest ? 1 : 20
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
        const { priceCents, rrpCents, colorCode, colorCode2 } = await resolveCatalogDetails(sv.retail_price, sv.variant_id)
        const attrs: Record<string, any> = {}
        if (sv.size) attrs.size = sv.size
        if (sv.color) attrs.color = sv.color
        if (colorCode) attrs.color_code = colorCode
        if (colorCode2) attrs.color_code2 = colorCode2
        if (rrpCents) attrs.rrp_cents = rrpCents

        const existingVar = existingByPfId.get(sv.id)
        if (existingVar) {
          // Always update attributes to ensure color codes and RRP are synced, even if price is already set
          await supabase
            .from('product_variants')
            .update({
              price_cents: existingVar.price_cents === 0 ? priceCents : existingVar.price_cents,
              attributes: attrs
            })
            .eq('id', existingVar.id)
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

      if (onlyLatest) break
    }

    if (onlyLatest) break

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
