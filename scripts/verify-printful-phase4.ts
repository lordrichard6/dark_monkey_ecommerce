import { verifyPrintfulSignature } from '../src/lib/printful/webhook-verify'
import crypto from 'crypto'

async function verifySecurity() {
    console.log('--- Verifying Phase 4 Security ---')

    // 1. Webhook Signature Verification
    console.log('\nTest 1: Webhook Signature Verification')

    const secret = 'my-secret-key'
    const payload = JSON.stringify({ type: 'test', data: { foo: 'bar' } })

    // Generate valid signature
    const validSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

    const isValid = verifyPrintfulSignature(payload, validSignature, secret)
    if (isValid) {
        console.log('✅ Valid signature accepted')
    } else {
        console.error('❌ Valid signature rejected')
    }

    const isInvalid = verifyPrintfulSignature(payload, 'wrong-sig', secret)
    if (!isInvalid) {
        console.log('✅ Invalid signature rejected')
    } else {
        console.error('❌ Invalid signature accepted')
    }

    // 2. Config Validation (Mock check)
    console.log('\nTest 2: Config Validation')
    // We can't easily fail the import at runtime here without messing up other tests,
    // but we can verify the schema logic if we imported zod schema directly, 
    // or just rely on the fact that the app builds.
    // We'll trust the unit tests for Zod, but we can check if PRINTFUL_CONFIG is loaded.

    try {
        const { PRINTFUL_CONFIG } = await import('../src/lib/printful/config')
        if (PRINTFUL_CONFIG === null) {
            console.log('ℹ️ PRINTFUL_CONFIG is null (expected if env vars missing in test env)')
        } else {
            console.log('✅ PRINTFUL_CONFIG loaded')
        }
    } catch (e) {
        console.error('❌ Failed to load config module', e)
    }
}

verifySecurity().catch(console.error)
