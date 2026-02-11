'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
    useEffect(() => {
        // Only register in production and if service worker is supported
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            process.env.NODE_ENV === 'production'
        ) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered successfully:', registration.scope)

                    // Check for updates every hour
                    setInterval(
                        () => {
                            registration.update()
                        },
                        60 * 60 * 1000
                    )

                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing

                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker available
                                    console.log('New service worker available!')

                                    // Optional: Show update notification to user
                                    if (window.confirm('A new version is available. Reload to update?')) {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                                        window.location.reload()
                                    }
                                }
                            })
                        }
                    })
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error)
                })

            // Listen for controller change (new SW activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('New service worker activated')
            })
        } else {
            console.log('Service Worker not registered (dev mode or not supported)')
        }
    }, [])

    return null
}
