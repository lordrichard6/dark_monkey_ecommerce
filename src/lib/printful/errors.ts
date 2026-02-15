export class PrintfulError extends Error {
    constructor(message: string, public code?: number | string, public details?: any) {
        super(message)
        this.name = 'PrintfulError'
    }
}

export class PrintfulRateLimitError extends PrintfulError {
    constructor(message: string, public retryAfter?: number) {
        super(message, 429)
        this.name = 'PrintfulRateLimitError'
    }
}

export class PrintfulAuthError extends PrintfulError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401)
        this.name = 'PrintfulAuthError'
    }
}

export class PrintfulNetworkError extends PrintfulError {
    constructor(message: string, public originalError?: Error) {
        super(message)
        this.name = 'PrintfulNetworkError'
    }
}

export class PrintfulApiError extends PrintfulError {
    constructor(message: string, public statusCode: number, public reason?: string) {
        super(message, statusCode)
        this.name = 'PrintfulApiError'
    }
}
