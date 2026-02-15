import { PrintfulNetworkError, PrintfulApiError, PrintfulRateLimitError } from './errors'
import { PRINTFUL_CONFIG } from './config'

type RetryConfig = {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
    retryableStatuses?: number[]
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
    maxRetries: PRINTFUL_CONFIG.RETRY.MAX_RETRIES,
    initialDelay: PRINTFUL_CONFIG.RETRY.INITIAL_DELAY,
    maxDelay: PRINTFUL_CONFIG.RETRY.MAX_DELAY,
    backoffMultiplier: PRINTFUL_CONFIG.RETRY.BACKOFF_MULTIPLIER,
    retryableStatuses: [...PRINTFUL_CONFIG.RETRY.RETRYABLE_STATUSES],
}

export async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    config: RetryConfig = {}
): Promise<Response> {
    const cfg = { ...DEFAULT_CONFIG, ...config }
    let lastError: Error | null = null
    let delay = cfg.initialDelay

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
        try {
            const response = await fetch(url, options)

            // If success or not a retryable status, return immediately
            if (response.ok || !cfg.retryableStatuses.includes(response.status)) {
                return response
            }

            // It's a retryable error status (429, 5xx)
            if (response.status === 429) {
                let retryAfter = 0
                const headerVal = response.headers.get('Retry-After')
                if (headerVal) {
                    retryAfter = parseInt(headerVal, 10) * 1000
                }
                lastError = new PrintfulRateLimitError('Rate limit exceeded', retryAfter > 0 ? retryAfter : undefined)

                if (retryAfter > 0) {
                    delay = Math.min(retryAfter, cfg.maxDelay)
                }
            } else {
                lastError = new PrintfulApiError(`HTTP ${response.status}: ${response.statusText}`, response.status)
            }
        } catch (error) {
            // Network errors are retryable
            lastError = new PrintfulNetworkError(
                error instanceof Error ? error.message : 'Unknown network error',
                error instanceof Error ? error : undefined
            )
        }

        // Prepare for next attempt if we haven't exhausted retries
        if (attempt < cfg.maxRetries) {
            // console.warn(`[Printful] Attempt ${attempt + 1}/${cfg.maxRetries + 1} failed. Retrying in ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            delay = Math.min(delay * cfg.backoffMultiplier, cfg.maxDelay)
        }
    }

    throw lastError || new Error(`Failed after ${cfg.maxRetries + 1} attempts`)
}
