import crypto from 'crypto'

/**
 * Verifies the Printful webhook signature.
 * 
 * @param bodyRaw - The raw request body as a string.
 * @param signature - The 'x-printful-signature' header value.
 * @param secret - The webhook secret key.
 * @returns true if signature is valid, false otherwise.
 */
export function verifyPrintfulSignature(
    bodyRaw: string,
    signature: string,
    secret: string
): boolean {
    if (!bodyRaw || !signature || !secret) return false

    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(bodyRaw).digest('hex')
    const signatureBuffer = Buffer.from(signature)
    const digestBuffer = Buffer.from(digest)

    if (signatureBuffer.length !== digestBuffer.length) {
        return false
    }

    // timingSafeEqual prevents timing attacks
    return crypto.timingSafeEqual(signatureBuffer, digestBuffer)
}
