/**
 * Pulsar App Service Worker
 * Handles offline support, caching, and background sync
 */

const CACHE_NAME = 'pulsar-v2'
const ASSET_CACHE = 'pulsar-assets-v2'
const API_CACHE = 'pulsar-api-v2'
const API_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
]

/**
 * Install event - cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Continue even if some assets fail to cache
        console.warn('[SW] Some assets failed to cache')
      })
    })
  )
  self.skipWaiting() // Activate immediately
})

/**
 * Activate event - clean up old caches and expired API entries
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(
    Promise.all([
      // Delete old cache versions
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![CACHE_NAME, ASSET_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Clean expired API cache entries
      cleanExpiredApiCache(),
    ])
  )
  self.clients.claim() // Take control immediately
})

/**
 * Remove API cache entries older than API_CACHE_MAX_AGE
 */
async function cleanExpiredApiCache() {
  try {
    const cache = await caches.open(API_CACHE)
    const requests = await cache.keys()
    const now = Date.now()

    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const dateHeader = response.headers.get('date')
        if (dateHeader) {
          const age = now - new Date(dateHeader).getTime()
          if (age > API_CACHE_MAX_AGE) {
            await cache.delete(request)
          }
        }
      }
    }
  } catch (err) {
    console.warn('[SW] Error cleaning API cache:', err)
  }
}

/**
 * Fetch event - cache-first with network fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome extensions and external URLs
  if (url.protocol === 'chrome-extension:' || !url.hostname.includes(self.location.hostname)) {
    return
  }

  // API requests - network first, then cache (with expiry)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fall back to cached API response, but check expiry
          return caches.match(request).then((response) => {
            if (response) {
              const dateHeader = response.headers.get('date')
              if (dateHeader) {
                const age = Date.now() - new Date(dateHeader).getTime()
                if (age > API_CACHE_MAX_AGE) {
                  // Stale cache — don't serve expired data
                  return new Response('Offline - cached data expired', { status: 503 })
                }
              }
              console.log('[SW] Serving API from cache:', request.url)
              return response
            }
            // Return offline error page
            return new Response('Offline - API not available', { status: 503 })
          })
        })
    )
    return
  }

  // Next.js hashed chunks (_next/static/) are immutable by URL — skip SW caching,
  // let the browser HTTP cache handle them. This prevents stale chunks after deploys.
  if (url.pathname.startsWith('/_next/static/')) {
    return // fall through to browser HTTP cache
  }

  // Other assets (styles, images) — cache first, then network
  if (request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) return response
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    )
    return
  }

  // Default — network first, cache fallback (never return undefined)
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(async () => {
        const cached = await caches.match(request)
        return cached ?? new Response('Offline', { status: 503, statusText: 'Offline' })
      })
  )
})

/**
 * Background sync - tell the client to flush its IndexedDB sync queue
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_QUEUE' })
        })
        console.log('[SW] Background sync: notified', clients.length, 'client(s)')
      })
    )
  }
})

/**
 * Message handler - respond to client messages
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName)
      })
    })
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    // Estimate cache size
    caches.keys().then((cacheNames) => {
      let totalSize = 0
      Promise.all(
        cacheNames.map((cacheName) => {
          return caches.open(cacheName).then((cache) => {
            cache.keys().then((requests) => {
              totalSize += requests.length * 1024 // Rough estimate
            })
          })
        })
      ).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size: totalSize })
      })
    })
  }
})
