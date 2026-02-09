'use server'

import { fetchStoreProducts, isPrintfulConfigured } from '@/lib/printful'

export async function testPrintfulConnection() {
    if (!isPrintfulConfigured()) {
        return {
            ok: false,
            error: 'Printful is not configured. Check PRINTFUL_API_TOKEN.'
        }
    }

    try {
        console.log('[TestPrintful] Attempting to fetch store products...')
        const result = await fetchStoreProducts(0, 1)

        if (result.ok) {
            return {
                ok: true,
                message: 'Connection successful',
                data: `Connected to Printful store. ${result.total} products found.`,
                tokenPrefix: process.env.PRINTFUL_API_TOKEN?.trim().substring(0, 7)
            }
        } else {
            return {
                ok: false,
                error: result.error || 'Printful connection failed',
                code: 'PRINTFUL_ERROR'
            }
        }
    } catch (err: any) {
        console.error('[TestPrintful] Connection failed:', err)
        return {
            ok: false,
            error: err.message,
            fullError: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        }
    }
}
