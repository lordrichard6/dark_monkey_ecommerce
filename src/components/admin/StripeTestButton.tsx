'use client'

import { useState } from 'react'
import { testStripeConnection } from '@/actions/test-stripe'
import { CheckCircle2, RotateCw, XCircle } from 'lucide-react'

export function StripeTestButton() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    async function handleTest() {
        setLoading(true)
        setResult(null)
        try {
            const res = await testStripeConnection()
            setResult(res)
        } catch (err) {
            setResult({ ok: false, error: 'Client-side error calling action' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Stripe Connection</p>
                {result?.ok && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {result?.ok === false && <XCircle className="h-5 w-5 text-red-500" />}
            </div>

            {!result ? (
                <p className="mt-2 text-2xl font-bold text-zinc-50">Unknown</p>
            ) : result.ok ? (
                <div>
                    <p className="mt-2 text-lg font-bold text-emerald-400">Connected</p>
                    <p className="text-xs text-zinc-500 font-mono mt-1">
                        Prefix: {result.keyPrefix}
                    </p>
                </div>
            ) : (
                <div>
                    <p className="mt-2 text-lg font-bold text-red-400">Failed</p>
                    <p className="text-xs text-red-300 mt-1 break-words">
                        {result.error} ({result.code})
                    </p>
                </div>
            )}

            <button
                onClick={handleTest}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
                {loading ? <RotateCw className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </button>

            {result?.fullError && (
                <details className="mt-4">
                    <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
                        View Full Error
                    </summary>
                    <pre className="mt-2 text-[10px] text-zinc-600 overflow-x-auto p-2 bg-black rounded">
                        {JSON.stringify(result.fullError, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    )
}
