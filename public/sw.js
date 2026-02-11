// DarkMonkey PWA Service Worker
// Version 1.0.0

const CACHE_NAME = 'darkmonkey-v1'
const OFFLINE_URL = '/offline'

// Critical assets to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/offline',
    '/products',
    '/manifest.json',
    '/logo.png',
]

// Install event - precache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...')

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching critical assets')
            return cache.addAll(PRECACHE_URLS)
        })
    )

    // Activate immediately without waiting
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name)
                        return caches.delete(name)
                    })
            )
        })
    )

    // Take control of all pages immediately
    self.clients.claim()
})

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return
    }

    // Network-first strategy with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Don't cache if not a successful response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response
                }

                // Clone the response before caching
                const responseToCache = response.clone()

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache)
                })

                return response
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse
                    }

                    // No cache match, return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL)
                    }

                    // For other requests, return a basic response
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain',
                        }),
                    })
                })
            })
    )
})

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received')

    const data = event.data?.json() ?? {}
    const title = data.title || 'DarkMonkey'
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data,
        tag: data.tag || 'default',
        requireInteraction: false,
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked')

    event.notification.close()

    const urlToOpen = event.notification.data?.url || '/'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i]
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus()
                    }
                }

                // No window open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen)
                }
            })
    )
})

// Background sync event (for offline cart sync, etc.)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag)

    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart())
    }
})

async function syncCart() {
    // This will be implemented later for offline cart sync
    console.log('[SW] Syncing cart...')
}

// Message event (for communication with pages)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data)

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
