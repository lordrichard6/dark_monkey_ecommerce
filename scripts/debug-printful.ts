
import { fetchSyncProduct } from '@/lib/printful'

async function run() {
    // Reporting Mode: Fetch raw sync product data for user
    const finalId = 418190750;
    console.log(`FETCHING RAW DATA FOR PRODUCT ${finalId} (UUID: 170b4ed3-...)`);

    try {
        const token = process.env.PRINTFUL_API_TOKEN
        // Fetch Sync Product
        const res = await fetch(`https://api.printful.com/store/products/${finalId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })
        const data = await res.json()

        if (res.ok) {
            console.log('--- RAW SYNC PRODUCT RESPONSE ---')
            console.log(`Product Name: ${data.result.sync_product.name}`)
            console.log(`Thumbnail: ${data.result.sync_product.thumbnail_url}`)

            console.log('--- SYNC VARIANTS FILES ---')
            data.result.sync_variants.forEach((v: any) => {
                console.log(`Variant: ${v.name} (ID: ${v.id})`)
                if (v.files) {
                    v.files.forEach((f: any) => {
                        console.log(`  - [${f.type}] ${f.preview_url || f.thumbnail_url} (Visible: ${f.visible})`)
                    })
                } else {
                    console.log('  - No files')
                }
            })
        } else {
            console.log('Failed to fetch raw sync product')
            console.error(data)
        }
    } catch (e) {
        console.error(e)
    }
}

run()
