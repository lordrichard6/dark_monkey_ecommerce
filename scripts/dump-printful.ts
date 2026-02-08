
import { fetchSyncProduct } from '@/lib/printful'
import fs from 'fs'
import path from 'path'

async function run() {
    const customId = 418190750 // The older "Dark Monkey" ID
    console.log(`Fetching product ${customId}...`)
    const result = await fetchSyncProduct(customId)

    if (!result.ok || !result.product) {
        console.error('Failed', result.error)
        return
    }

    const dumpPath = path.join(process.cwd(), 'printful-product-dump.json')
    fs.writeFileSync(dumpPath, JSON.stringify(result.product, null, 2))
    console.log(`Dumped product JSON to ${dumpPath}`)
}

run()
