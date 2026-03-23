/**
 * Pulsar App Service Worker
 * Handles offline support, caching, and background sync
 */

const CACHE_NAME = 'pulsar-v1'
const ASSET_CACHE = 'pulsar-assets-v1'
const API_CACHE = 'pulsar-api-v1'

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
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, ASSET_CACHE, API_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim() // Take control immediately
})

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

  // API requests - network first, then cache
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
          // Fall back to cached API response
          return caches.match(request).then((response) => {
            if (response) {
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

  // Assets - cache first, then network
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image') {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response
          }

          return fetch(request).then((response) => {
            // Cache successful asset responses
            if (response.status === 200) {
              const responseClone = response.clone()
              cache.put(request, responseClone)
            }
            return response
          })
        })
      })
    )
    return
  }

  // Default - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request)
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
