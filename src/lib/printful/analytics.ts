import { logger } from './logger'

export class PrintfulAnalytics {
    /**
     * Tracks the duration of an async operation and logs it.
     */
    async trackDuration<T>(
        operation: string,
        fn: () => Promise<T>,
        context?: Record<string, any>
    ): Promise<T> {
        const start = Date.now()
        try {
            const result = await fn()
            const duration = Date.now() - start

            logger.info(`${operation} completed`, {
                operation,
                duration,
                success: true,
                ...context
            })

            return result
        } catch (error) {
            const duration = Date.now() - start
            logger.error(`${operation} failed`, {
                operation,
                duration,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                ...context
            })
            throw error
        }
    }

    /**
     * Logs summary statistics for a sync job.
     */
    trackSyncStats(stats: {
        synced: number
        skipped: number
        totalFromApi: number
        duration: number
        errors?: string[]
    }) {
        logger.info('Printful Sync Summary', {
            operation: 'sync_job_summary',
            ...stats
        })
    }
}

export const printfulAnalytics = new PrintfulAnalytics()
