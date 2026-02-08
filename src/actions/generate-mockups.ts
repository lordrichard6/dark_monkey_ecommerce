
import { getAdminClient } from '@/lib/supabase/admin'
import { fetchSyncProduct } from '@/lib/printful'

const API_BASE = 'https://api.printful.com'

/**
 * Generates mockups for a given Printful Sync Product ID.
 * This effectively "fills in" the missing images that sync didn't provide.
 */
export async function generateMockupsForProduct(storeProductId: number) {
    const supabase = getAdminClient()

    // 1. Fetch Sync Product to get print files and catalog IDs
    console.log(`Fetching Sync Product ${storeProductId}...`)
    const syncProduct = await fetchSyncProduct(storeProductId)
    if (!syncProduct || !syncProduct.product) {
        console.error('Fetch failed details:', JSON.stringify(syncProduct, null, 2))
        throw new Error(`Failed to fetch sync product: ${syncProduct?.error || 'Unknown error'}`)
    }

    const sp = syncProduct.product.sync_product
    const variants = syncProduct.product.sync_variants

    // 2. Group variants by Color
    // We want to generate ONE set of mockups per color (using one representative variant)
    const variantsByColor = new Map<string, typeof variants[0]>()

    for (const v of variants) {
        // Extract color functionality depends on naming convention or if we have it in DB?
        // Sync API returns variant name like "Unisex Hoodie ... / Red / L"
        // We can try to parse it or use existing logic if possible.
        // Simple parser: Name is usually "Product Name / Color / Size"
        // But color can be "Navy Blazer".
        // Alternatively, look at `variant_id` (Catalog Variant ID).
        // Let's rely on name parsing as in sync script for now.

        // Actually, sync-printful.ts uses a helper or just parses?
        // Let's assume the name format "Product - Color - Size" or similar.
        // Standard Printful name: "Product Name - Color / Size"
        // Let's split by " - " or " / ".

        // Better: We can just process ALL unique colors we find.
        // And for each color, pick a representative variant (e.g. Size M).
        // The Catalog Variant ID (v.product.variant_id) is what we need for the generator.

        // We need to group by color to avoid generating 10 mockups for the same color (S, M, L...).
        // Let's try to extract color name.
        // SyncVariant has product: { name: ... }
        const name = v.product.name

        // Let's parse the name.
        const nameParts = name.split(' / ')
        if (nameParts.length >= 2) {
            // Assuming Format: Name / Color / Size
            // Color is nameParts[nameParts.length - 2]
            const color = nameParts[nameParts.length - 2].trim()

            // Only save the FIRST variant of this color as representative
            if (!variantsByColor.has(color)) {
                variantsByColor.set(color, v)
            }
        }
    }

    console.log(`Found ${variantsByColor.size} colors to generate mockups for.`)

    const productsPayload = []

    for (const [color, variant] of variantsByColor.entries()) {
        // Get Print Files
        const files = variant.files || []
        const frontFile = files.find((f: any) => f.type === 'default' || f.type === 'front')
        const backFile = files.find((f: any) => f.type === 'back')

        if (!frontFile && !backFile) {
            console.log(`Skipping color ${color}: No print files found`)
            continue
        }

        // Construct Placements
        const placements = []
        if (frontFile?.preview_url) {
            placements.push({
                placement: 'front',
                technique: 'DTG',
                layers: [{ type: 'file', url: frontFile.preview_url }]
            })
        }
        if (backFile?.preview_url) {
            placements.push({
                placement: 'back',
                technique: 'DTG',
                layers: [{ type: 'file', url: backFile.preview_url }]
            })
        }

        // Add to payload
        productsPayload.push({
            source: 'catalog',
            catalog_product_id: variant.product.product_id, // e.g. 380
            catalog_variant_ids: [variant.product.variant_id], // e.g. 11491
            placements: placements,
            format: 'jpg',
            width: 1000
        })
    }

    if (productsPayload.length === 0) {
        return { success: false, message: 'No valid variants/files found' }
    }

    // 3. Call Mockup Generator API
    const token = process.env.PRINTFUL_API_TOKEN
    if (!token) throw new Error('Missing PRINTFUL_API_TOKEN')

    // Batch? API might handle array.
    // Let's send one big request.
    const res = await fetch(`${API_BASE}/v2/mockup-tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ products: productsPayload })
    })

    const data = await res.json()

    // Handle response (might be multiple tasks if we sent multiple products? or one task with sub-tasks?)
    // Response structure: { data: [ { id: ... }, { id: ... } ] }
    // We get one task ID per item in products array.

    const tasks = data.data || []
    const taskIds = tasks.map((t: any) => t.id).filter(Boolean)

    if (taskIds.length === 0) {
        console.error('No tasks created', data)
        return { success: false, message: 'Failed to create generation tasks' }
    }

    console.log(`Created ${taskIds.length} tasks. Waiting for completion...`)

    // 4. Poll for ALL tasks
    const results = await Promise.all(taskIds.map((id: number) => waitForTask(id, token)))

    // 5. Save results to DB
    let savedCount = 0

    if (results.length > 0 && supabase) {
        const { data: dbProduct } = await supabase
            .from('products')
            .select('id')
            .eq('printful_sync_product_id', storeProductId)
            .single()

        if (dbProduct) {
            for (const result of results) {
                if (!result) continue

                // Build variantId -> color map
                const variantIdToColor = new Map<number, string>()
                for (const [color, v] of variantsByColor.entries()) {
                    variantIdToColor.set(v.product.variant_id, color)
                }

                const variantsMockups = result.catalog_variant_mockups || []
                for (const vm of variantsMockups) {
                    const vId = vm.catalog_variant_id
                    const color = variantIdToColor.get(vId)
                    if (!color) continue

                    for (const m of vm.mockups || []) {
                        if (m.mockup_url) {
                            await supabase.from('product_images').insert({
                                product_id: dbProduct.id,
                                url: m.mockup_url,
                                alt: `${sp.name} - ${color} (${m.placement})`,
                                color: color,
                                sort_order: 10
                            })
                            savedCount++
                        }
                    }
                }
            }
        }
    }

    return { success: true, count: savedCount }
}

async function waitForTask(taskId: number, token: string) {
    let attempts = 0
    while (attempts < 30) { // 60s timeout
        await new Promise(r => setTimeout(r, 2000))
        attempts++

        const res = await fetch(`${API_BASE}/v2/mockup-tasks?id=${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        const item = data.data?.[0]

        if (item?.status === 'completed') return item
        if (item?.status === 'failed') return null
    }
    return null
}
