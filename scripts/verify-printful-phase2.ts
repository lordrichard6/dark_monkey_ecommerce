import { fetchWithRetry } from '../src/lib/printful/retry'
import { PrintfulApiError, PrintfulRateLimitError, PrintfulNetworkError } from '../src/lib/printful/errors'

async function verifyErrorHandling() {
    console.log('--- Verifying Phase 2 Error Handling ---')

    const originalFetch = global.fetch

    // 1. Verify 429 Rate Limit Error
    console.log('\nTest 1: Rate Limit Error (429)')
    global.fetch = async () => new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '1' }
    }) as any

    try {
        await fetchWithRetry('https://api.printful.com/test', {}, { maxRetries: 0 })
    } catch (err) {
        if (err instanceof PrintfulRateLimitError) {
            console.log('✅ Caught PrintfulRateLimitError as expected')
            if (err.retryAfter === 1000) console.log('✅ Retry-After parsed correctly (1000ms)')
            else console.error('❌ Retry-After parsing failed', err.retryAfter)
        } else {
            console.error('❌ Wrong error type:', err)
        }
    }

    // 2. Verify 500 API Error
    console.log('\nTest 2: API Error (500)')
    global.fetch = async () => new Response(JSON.stringify({
        code: 500,
        error: { reason: 'Internal Server Error', message: 'Something went wrong' }
    }), { status: 500 }) as any

    try {
        await fetchWithRetry('https://api.printful.com/test', {}, { maxRetries: 0 })
    } catch (err) {
        if (err instanceof PrintfulApiError) {
            console.log('✅ Caught PrintfulApiError as expected')
            console.log(`   Message: ${err.message}, Code: ${err.statusCode}`)
        } else {
            // Note: fetchWithRetry currently throws PrintfulApiError for non-429 statuses
            console.log('ℹ️ Caught:', err)
            if (err instanceof PrintfulApiError) console.log('✅ Correctly identified as API Error')
        }
    }

    // Restore
    global.fetch = originalFetch
}

verifyErrorHandling().catch(console.error)
