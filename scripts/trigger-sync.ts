
import { syncPrintfulProducts } from '@/actions/sync-printful'

async function run() {
    console.log('Triggering Printful Sync...')
    const res = await syncPrintfulProducts()
    console.log('Sync Result:', res)
}

run()
