'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            <div className="text-center max-w-md">
                <div className="mb-6">
                    <WifiOff className="w-20 h-20 mx-auto text-zinc-600" strokeWidth={1.5} />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">You're Offline</h1>

                <p className="text-zinc-400 mb-8">
                    No internet connection detected. Some features may be limited until you're back online.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition mb-4"
                >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                </button>

                <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-400">
                        You can still browse products you've previously viewed
                    </p>
                </div>

                <div className="mt-6">
                    <Link
                        href="/"
                        className="text-sm text-green-500 hover:text-green-400 transition font-medium"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
