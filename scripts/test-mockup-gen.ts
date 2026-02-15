
import { generateMockupsForProduct } from '../src/actions/generate-mockups'
import { getAdminClient } from '../src/lib/supabase/admin'

// Test script for mockup generation
// Requires a valid Store Product ID (Printful Sync Product ID)

async function runTest() {
    console.log('🚀 Starting Mockup Generation Test...')

    const supabase = getAdminClient()
    if (!supabase) {
        console.error('❌ Database client not authenticated')
        process.exit(1)
    }

    // 1. Find a product that needs mockups (or just pick one)
    const { data: product } = await supabase
        .from('products')
        .select('id, name, printful_sync_product_id')
        .not('printful_sync_product_id', 'is', null)
        .limit(1)
        .single()

    if (!product || !product.printful_sync_product_id) {
        console.error('❌ No valid product found for test')
        process.exit(1)
    }

    console.log(`📝 Testing with product: ${product.name} (Sync ID: ${product.printful_sync_product_id})`)

    // 2. Run Generation
    console.log('🔄 Triggering mockup generation...')

    // NOTE: This will actually call Printful API and generate new mockups.
    // This is a "destructive" test in finding that it modifies DB images.
    // But for verification it's necessary.

    try {
        const result = await generateMockupsForProduct(product.printful_sync_product_id)
        console.log('Result:', result)

        if (result.success) {
            console.log(`✅ Generation successful! Added ${result.count} images.`)
        } else {
            console.error(`❌ Generation failed: ${result.message}`)
        }

    } catch (err) {
        console.error('❌ Generation script Exception:', err)
    }
}

runTest().catch(console.error)
