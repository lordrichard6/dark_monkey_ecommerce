import { z } from 'zod'

const printfulEnvSchema = z.object({
    PRINTFUL_API_TOKEN: z.string().min(1, 'PRINTFUL_API_TOKEN is required'),
    PRINTFUL_STORE_ID: z.string().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    PRINTFUL_WEBHOOK_SECRET: z.string().optional(),
    PRINTFUL_DEFAULT_PRINT_URL: z.string().url().optional(),
})

export function validatePrintfulConfig() {
    const result = printfulEnvSchema.safeParse({
        PRINTFUL_API_TOKEN: process.env.PRINTFUL_API_TOKEN,
        PRINTFUL_STORE_ID: process.env.PRINTFUL_STORE_ID,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        PRINTFUL_WEBHOOK_SECRET: process.env.PRINTFUL_WEBHOOK_SECRET,
        PRINTFUL_DEFAULT_PRINT_URL: process.env.PRINTFUL_DEFAULT_PRINT_URL,
    })

    if (!result.success) {
        const errors = result.error.errors.map((e) => `${e.path}: ${e.message}`).join(', ')
        // We log the error but don't crash the entire app module import, 
        // instead we throw when accessing the config or let isPrintfulConfigured handle it.
        // However, for strictness, we can return null or throw.
        // For this implementation, we'll return a partial or null and let the consumer decide.
        console.warn(`Printful configuration issue: ${errors}`)
        return null
    }

    return result.data
}

// Call on module load - this might be risky if env vars aren't loaded yet in some architectures,
// but for Next.js server-side it's usually fine.
// Validated Environment Config
export const PRINTFUL_ENV = validatePrintfulConfig()

// Application Constants & Configuration
export const PRINTFUL_CONFIG = {
    ...PRINTFUL_ENV,
    API_BASE: 'https://api.printful.com',
    RETRY: {
        MAX_RETRIES: 3,
        INITIAL_DELAY: 500,
        MAX_DELAY: 5000,
        BACKOFF_MULTIPLIER: 2,
        RETRYABLE_STATUSES: [408, 429, 500, 502, 503, 504],
    },
    RATE_LIMIT: {
        WINDOW_MS: 60000, // 1 minute
        MAX_REQUESTS: 120, // 120 requests per minute
    },
    CACHE: {
        TTL_MS: 3600000, // 1 hour
    },
    CONSTANTS: {
        DEFAULT_RETAIL_PRICE_CENTS: 3990,
        WHOLESALE_MARKUP_MULTIPLIER: 2.5,
        DEFAULT_INVENTORY_QTY: 50,
        SYNC_LIMIT: 20,
    }
}
