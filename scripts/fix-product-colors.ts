
import { createClient } from '@supabase/supabase-js'
import { fetchSyncProduct } from '@/lib/printful'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    const slug = 'snap-case-for-iphone-porsche'
    console.log(`Fixing colors for ${slug}...`)

    const { data: product } = await supabase
        .from('products')
        .select('id, printful_sync_product_id')
        .eq('slug', slug)
        .single()

    if (!product || !product.printful_sync_product_id) {
        console.error('Product not found or not linked to Printful')
        return
    }

    const { ok, product: pfProduct, error } = await fetchSyncProduct(product.printful_sync_product_id)
    if (!ok || !pfProduct) {
        console.error('Printful fetch failed:', error)
        return
    }

    console.log(`Fetched Printful product. Processing ${pfProduct.sync_variants.length} variants...`)

    let updated = 0

    for (const v of pfProduct.sync_variants) {
        const color = v.color
        const img = v.product.image

        if (!color) continue

        // Update main image
        if (img) {
            const { error } = await supabase
                .from('product_images')
                .update({ color })
                .eq('product_id', product.id)
                .eq('url', img)
            // Only update if color is null to avoid overwriting manually set stuff? 
            // Actually, force update is better here.

            if (!error) updated++
        }

        // Update additional files
        if (v.files) {
            for (const f of v.files) {
                const url = f.preview_url || f.thumbnail_url
                if (url) {
                    const { error } = await supabase
                        .from('product_images')
                        .update({ color })
                        .eq('product_id', product.id)
                        .eq('url', url)

                    if (!error) updated++
                }
            }
        }
    }

    console.log(`Updated ${updated} image records with color.`)
}

run()
