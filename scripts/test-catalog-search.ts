
import { fetchStoreProducts, searchCatalogProducts } from '../src/lib/printful'

async function runTest() {
    console.log('🚀 Starting Catalog Search Test...')

    // 1. Test Store Search (Filtering by status)
    // Printful Store Products statuses: 'synced', 'unsynced', 'ignored' (or similar?) 
    // API docs say: status: 'all' | 'active' | 'inactive' ? 
    // Let's try 'all' (default) implicitly by not passing it, and then maybe 'active' if applicable.
    // Actually, Printful Sync API statuses are 'synced', 'unsynced'.

    console.log('📦 Testing Store Products (Status: synced)...')
    const storeRes = await fetchStoreProducts(0, 5, 'synced')
    if (storeRes.ok) {
        console.log(`✅ Found ${storeRes.products?.length} synced products (Total: ${storeRes.total})`)
        if (storeRes.products?.length) {
            console.log(`   Sample: ${storeRes.products[0].name}`)
        }
    } else {
        console.error('❌ Store search failed:', storeRes.error)
    }

    // 2. Test Global Catalog Search
    const query = 'Hoodie'
    console.log(`\n🌍 Testing Global Catalog Search (Query: "${query}")...`)
    const catalogRes = await searchCatalogProducts(query)

    if (catalogRes.ok) {
        console.log(`✅ Found ${catalogRes.products?.length} catalog items`)
        if (catalogRes.products?.length) {
            console.log(`   Sample: ${catalogRes.products[0].title} (ID: ${catalogRes.products[0].id})`)
        }
    } else {
        console.error('❌ Catalog search failed:', catalogRes.error)
    }
}

runTest().catch(console.error)
