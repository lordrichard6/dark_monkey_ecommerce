'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [showIOSInstructions, setShowIOSInstructions] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        const dismissedTime = dismissed ? parseInt(dismissed) : 0
        const now = Date.now()

        // Show again after 7 days
        if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
            return
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(isIOSDevice)

        if (isIOSDevice) {
            // iOS doesn't support beforeinstallprompt, show manual instructions
            setShowPrompt(true)
        } else {
            // Listen for install prompt event (Android/Chrome)
            const handler = (e: Event) => {
                e.preventDefault()
                setDeferredPrompt(e)
                setShowPrompt(true)
            }

            window.addEventListener('beforeinstallprompt', handler)

            return () => window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('PWA installed')
        }

        setDeferredPrompt(null)
        setShowPrompt(false)
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    const handleIOSInstructions = () => {
        setShowIOSInstructions(true)
    }

    if (!showPrompt) return null

    return (
        <>
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-4">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white transition"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-2.5 rounded-lg">
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 pr-6">
                        <h3 className="font-semibold text-white mb-1">Install DarkMonkey App</h3>
                        <p className="text-sm text-zinc-400">
                            Get faster access, offline browsing, and exclusive app features
                        </p>

                        {isIOS ? (
                            <button
                                onClick={handleIOSInstructions}
                                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
                            >
                                Show Install Instructions
                            </button>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Install App
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Install on iOS</h3>
                            <button
                                onClick={() => setShowIOSInstructions(false)}
                                className="text-zinc-400 hover:text-white transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-zinc-300">
                            <div className="flex gap-3">
                                <div className="bg-green-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-white font-bold">
                                    1
                                </div>
                                <p>
                                    Tap the <span className="font-semibold text-white">Share</span> button in Safari
                                    (square with arrow pointing up)
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <div className="bg-green-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-white font-bold">
                                    2
                                </div>
                                <p>
                                    Scroll down and tap{' '}
                                    <span className="font-semibold text-white">"Add to Home Screen"</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <div className="bg-green-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-white font-bold">
                                    3
                                </div>
                                <p>
                                    Tap <span className="font-semibold text-white">"Add"</span> in the top right corner
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowIOSInstructions(false)
                                handleDismiss()
                            }}
                            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
