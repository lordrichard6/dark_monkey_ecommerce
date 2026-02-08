
import { createClient } from '@/lib/supabase/client'
import { getAdminClient } from '@/lib/supabase/admin'

async function listImages() {
    const supabase = getAdminClient()
    if (!supabase) {
        console.error('No Supabase admin client')
        return
    }

    const slug = 'snap-case-for-iphone-porsche'
    const { data: product } = await supabase.from('products').select('id').eq('slug', slug).single()

    if (!product) {
        console.error('Product not found')
        return
    }

    const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order')

    if (!images) return

    // Log URLs to check for duplicates
    const counts: Record<string, number> = {}
    images.forEach(img => {
        counts[img.url] = (counts[img.url] || 0) + 1
    })

    console.log('Total images:', images.length)
    console.log('Unique URLs:', Object.keys(counts).length)
    console.log('Sample images:', images.slice(0, 5))

    // Check duplicates by color
    const byColor: Record<string, string[]> = {}
    images.forEach(img => {
        const c = img.color || 'null'
        if (!byColor[c]) byColor[c] = []
        byColor[c].push(img.url)
    })

    console.log(`[${new Date().toISOString()}] CHECK COMPLETE`)
    console.log('Images by color:', Object.entries(byColor).map(([c, urls]) => `${c}: ${urls.length} images`))
}

listImages().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
