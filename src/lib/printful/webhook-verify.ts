/**
 * Verifies a Printful webhook payload belongs to our store.
 *
 * NOTE: Printful API v1 does NOT sign webhooks — there is no `x-printful-signature`
 * header in v1. Request signing is a Printful API v2 feature (currently in Open Beta).
 *
 * Since v1 webhooks are unsigned, we verify authenticity by checking that the `store`
 * field in the payload matches our configured PRINTFUL_STORE_ID. This prevents payloads
 * from other Printful stores from being processed.
 *
 * @param storeId       - The numeric store ID from the incoming webhook payload (`event.store`).
 * @param expectedStoreId - Our configured PRINTFUL_STORE_ID env var (string). If not set,
 *                          all payloads are accepted (development fallback).
 * @returns true if the store IDs match, or if no expected store ID is configured.
 */
export function verifyPrintfulWebhook(
  storeId: number | undefined,
  expectedStoreId: string | undefined
): boolean {
  // If PRINTFUL_STORE_ID is not configured, allow all (dev/testing fallback)
  if (!expectedStoreId) return true

  // Reject payloads with no store field
  if (storeId === undefined || storeId === null) return false

  return String(storeId) === expectedStoreId
}
