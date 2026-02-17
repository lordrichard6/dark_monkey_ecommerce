import { verifyPrintfulWebhook } from '../src/lib/printful/webhook-verify'

async function verifySecurity() {
  console.log('--- Verifying Phase 4 Security ---')

  // 1. Webhook Store ID Verification
  // NOTE: Printful API v1 does not sign webhooks (no x-printful-signature).
  // We verify authenticity by checking the store ID in the payload.
  console.log('\nTest 1: Webhook Store ID Verification')

  const expectedStoreId = '12345'

  const isValid = verifyPrintfulWebhook(12345, expectedStoreId)
  if (isValid) {
    console.log('✅ Matching store ID accepted')
  } else {
    console.error('❌ Matching store ID rejected (unexpected)')
  }

  const isInvalidStore = verifyPrintfulWebhook(99999, expectedStoreId)
  if (!isInvalidStore) {
    console.log('✅ Mismatched store ID rejected')
  } else {
    console.error('❌ Mismatched store ID accepted (unexpected)')
  }

  const isAllowedWithNoConfig = verifyPrintfulWebhook(12345, undefined)
  if (isAllowedWithNoConfig) {
    console.log('✅ No expected store ID configured — allowed (dev fallback)')
  } else {
    console.error('❌ Unexpected rejection when no store ID configured')
  }

  // 2. Config Validation (Mock check)
  console.log('\nTest 2: Config Validation')
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
