
import { syncPrintfulProducts } from '../src/actions/sync-printful'

async function runTest() {
    console.log('🚀 Starting Refactored Sync Test...')
    console.log('Using IS_CLI_SYNC=true bypass...')

    process.env.IS_CLI_SYNC = 'true'

    // Run sync for only latest product to verify flow
    try {
        const result = await syncPrintfulProducts(true, true) // debug=true, onlyLatest=true
        console.log('Sync Results:', result)

        if (result.ok) {
            console.log(`✅ Sync successful! Synced: ${result.synced}, Skipped: ${result.skipped}`)
        } else {
            console.error(`❌ Sync failed: ${result.error}`)
        }

    } catch (err) {
        console.error('❌ Sync script Exception:', err)
    }
}

runTest().catch(console.error)
