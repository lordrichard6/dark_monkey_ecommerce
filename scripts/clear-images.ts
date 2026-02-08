
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    const slug = 'snap-case-for-iphone-porsche'
    console.log(`Clearing images for ${slug}...`)

    const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!product) {
        console.error('Product not found')
        return
    }

    // Delete all images for this product
    const { error, count } = await supabase
        .from('product_images')
        .delete({ count: 'exact' })
        .eq('product_id', product.id)

    if (error) {
        console.error('Error deleting images:', error)
    } else {
        console.log(`Deleted ${count} images.`)
    }
}

run()
