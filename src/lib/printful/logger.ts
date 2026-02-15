type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = {
    operation: string
    printfulOrderId?: number
    supabaseOrderId?: string
    variantId?: number
    productId?: number
    duration?: number
    error?: string
    [key: string]: any
}

export class PrintfulLogger {
    private isDev = process.env.NODE_ENV === 'development'

    private log(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString()
        const logEntry = {
            timestamp,
            level,
            message,
            service: 'printful',
            ...context,
        }

        // In a real production app, we would send this to a service like Datadog/Sentry
        // if (!this.isDev && typeof window === 'undefined') { ... }

        // Console logging
        const prefix = `[Printful:${level.toUpperCase()}]`

        // In dev, we want readable logs. In prod, we might want JSON for ingestion.
        if (this.isDev) {
            const contextStr = context ? JSON.stringify(context, null, 2) : ''
            switch (level) {
                case 'error':
                    console.error(prefix, message, contextStr)
                    break
                case 'warn':
                    console.warn(prefix, message, contextStr)
                    break
                case 'info':
                    console.log(prefix, message, contextStr)
                    break
                case 'debug':
                    console.debug(prefix, message, contextStr)
                    break
            }
        } else {
            // updates for structured logging in production environments (e.g. Vercel logs)
            console.log(JSON.stringify(logEntry))
        }
    }

    debug(message: string, context?: LogContext) {
        this.log('debug', message, context)
    }

    info(message: string, context?: LogContext) {
        this.log('info', message, context)
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context)
    }

    error(message: string, context?: LogContext) {
        this.log('error', message, context)
    }
}

export const logger = new PrintfulLogger()
