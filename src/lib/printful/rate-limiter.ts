import { PRINTFUL_CONFIG } from './config'

type QueueItem<T> = {
    fn: () => Promise<T>
    resolve: (value: T | PromiseLike<T>) => void
    reject: (reason?: any) => void
}

export class PrintfulRateLimiter {
    private queue: QueueItem<any>[] = []
    private processing = false
    private requestCount = 0
    private windowStart = Date.now()

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject })
            this.processQueue()
        })
    }

    private async processQueue() {
        if (this.processing) return
        this.processing = true

        while (this.queue.length > 0) {
            // Check window reset
            const now = Date.now()
            if (now - this.windowStart >= PRINTFUL_CONFIG.RATE_LIMIT.WINDOW_MS) {
                this.requestCount = 0
                this.windowStart = now
            }

            // Check limit
            if (this.requestCount >= PRINTFUL_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
                const waitTime = PRINTFUL_CONFIG.RATE_LIMIT.WINDOW_MS - (now - this.windowStart) + 100 // +100ms buffer
                if (waitTime > 0) {
                    await new Promise((r) => setTimeout(r, waitTime))
                    // Reset after wait
                    this.requestCount = 0
                    this.windowStart = Date.now()
                }
            }

            // Process next item
            if (this.queue.length > 0) {
                const item = this.queue.shift()
                if (item) {
                    this.requestCount++
                    try {
                        const result = await item.fn()
                        item.resolve(result)
                    } catch (error) {
                        item.reject(error)
                    }
                }
            }
        }

        this.processing = false
    }
}

export const rateLimiter = new PrintfulRateLimiter()
