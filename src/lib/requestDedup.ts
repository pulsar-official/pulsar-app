/**
 * Request Deduplication
 * Prevents duplicate API calls for the same endpoint/params
 * Automatically deduplicates rapid successive requests
 */

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest>()

/**
 * Generate a request key from endpoint and params
 */
function getRequestKey(
  endpoint: string,
  options?: {
    method?: string
    body?: any
  }
): string {
  const method = options?.method || 'GET'
  const body = options?.body ? JSON.stringify(options.body) : ''
  return `${method}:${endpoint}:${body}`
}

/**
 * Deduplicated fetch - returns same promise for identical concurrent requests
 */
export async function dedupFetch<T>(
  endpoint: string,
  options?: {
    method?: string
    body?: any
    headers?: Record<string, string>
    cache?: number // Cache result for this many seconds
  }
): Promise<T> {
  const key = getRequestKey(endpoint, options)

  // Check if request is already in flight
  const existing = pendingRequests.get(key)
  if (existing) {
    console.debug(`[Dedup] Returning cached promise for ${key}`)
    return existing.promise
  }

  // Create new request
  const promise = (async () => {
    try {
      const response = await fetch(endpoint, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data as T
    } finally {
      // Clean up after request completes
      pendingRequests.delete(key)
    }
  })()

  // Store promise
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  })

  return promise
}

/**
 * Clean up stale pending requests
 * Call periodically to prevent memory leaks
 */
export function cleanupStalePending(maxAgeMs = 60000) {
  const now = Date.now()
  let cleaned = 0

  pendingRequests.forEach((request, key) => {
    if (now - request.timestamp > maxAgeMs) {
      pendingRequests.delete(key)
      cleaned++
    }
  })

  if (cleaned > 0) {
    console.debug(`[Dedup] Cleaned up ${cleaned} stale requests`)
  }
}

/**
 * Get count of pending requests (for monitoring)
 */
export function getPendingCount(): number {
  return pendingRequests.size
}

/**
 * Clear all pending requests
 */
export function clearPending() {
  pendingRequests.clear()
}
