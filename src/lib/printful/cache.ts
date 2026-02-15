import { PRINTFUL_CONFIG } from './config'

type CacheEntry<T> = {
    data: T
    timestamp: number
}

export class PrintfulCache {
    private cache = new Map<string, CacheEntry<any>>()
    private readonly TTL_MS = PRINTFUL_CONFIG.CACHE.TTL_MS

    get<T>(key: string): T | null {
        const entry = this.cache.get(key)
        if (!entry) return null

        const age = Date.now() - entry.timestamp
        if (age > this.TTL_MS) {
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        })
    }

    clear(): void {
        this.cache.clear()
    }

    invalidate(pattern: RegExp): void {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key)
            }
        }
    }
}

export const printfulCache = new PrintfulCache()
