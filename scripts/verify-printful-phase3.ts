import { PrintfulLogger } from '../src/lib/printful/logger'
import { PrintfulAnalytics } from '../src/lib/printful/analytics'

// Mock console to capture output
const logs: string[] = []
const originalLog = console.log
const originalInfo = console.info
const originalWarn = console.warn
const originalError = console.error

function mockConsole(msg: any, ...args: any[]) {
    logs.push(JSON.stringify({ msg, args }))
    // originalLog(msg, ...args) // Extract comment to see real logs
}

console.log = mockConsole
console.info = mockConsole
console.warn = mockConsole
console.error = mockConsole

async function verifyLogging() {
    originalLog('--- Verifying Phase 3 Logging ---')

    const logger = new PrintfulLogger()

    logger.info('Test Info Log', { operation: 'test_op', foo: 'bar' })
    logger.error('Test Error Log', { operation: 'test_op', error: 'Something went wrong' })

    const infoLog = logs.find(l => l.includes('Test Info Log'))
    const errorLog = logs.find(l => l.includes('Test Error Log'))

    if (infoLog && infoLog.includes('test_op')) {
        originalLog('✅ Info log verified')
    } else {
        originalLog('❌ Info log missing or incorrect')
    }

    if (errorLog && errorLog.includes('Something went wrong')) {
        originalLog('✅ Error log verified')
    } else {
        originalLog('❌ Error log missing or incorrect')
    }
}

async function verifyAnalytics() {
    originalLog('\n--- Verifying Phase 3 Analytics ---')
    const analytics = new PrintfulAnalytics()

    await analytics.trackDuration('test_duration', async () => {
        await new Promise(r => setTimeout(r, 10))
        return 'done'
    })

    const durationLog = logs.find(l => l.includes('test_duration completed'))
    if (durationLog && durationLog.includes('duration')) {
        originalLog('✅ Duration tracking verified')
    } else {
        originalLog('❌ Duration tracking failed')
    }

    analytics.trackSyncStats({
        synced: 10,
        skipped: 5,
        totalFromApi: 15,
        duration: 1000
    })

    const statsLog = logs.find(l => l.includes('Printful Sync Summary'))
    if (statsLog && statsLog.includes('synced":10')) {
        originalLog('✅ Sync stats verified')
    } else {
        originalLog('❌ Sync stats failed')
    }
}

async function run() {
    try {
        await verifyLogging()
        await verifyAnalytics()
    } finally {
        console.log = originalLog
        console.info = originalInfo
        console.warn = originalWarn
        console.error = originalError
    }
}

run().catch(e => {
    console.error = originalError
    console.error(e)
})
