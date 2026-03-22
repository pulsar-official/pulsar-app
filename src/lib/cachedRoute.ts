/**
 * Cached Route Helper
 * Wraps API endpoints to automatically cache responses
 * Usage: Instead of normal fetch logic, use withCache
 */

import { NextResponse } from 'next/server'
import { getCached, setCached, cacheKeys } from './redis'

interface CacheOptions {
  ttl?: number // TTL in seconds, default 3600 (1 hour)
  key: string // Cache key
}

/**
 * Wraps a route handler to add Redis caching
 */
export function withCache<T>(
  handler: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  return withCacheAsync(handler, options)
}

/**
 * Internal implementation
 */
async function withCacheAsync<T>(
  handler: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const { ttl = 3600, key } = options

  // Try to get from cache first
  const cached = await getCached<T>(key)
  if (cached) {
    console.log(`[Cache] HIT: ${key}`)
    return cached
  }

  // Cache miss - fetch fresh data
  console.log(`[Cache] MISS: ${key}`)
  const data = await handler()

  // Store in cache
  await setCached(key, data, ttl)

  return data
}

/**
 * Example: How to use in an API endpoint
 *
 * // GET /api/productivity/tasks
 * export async function GET(request: NextRequest) {
 *   const { userId, orgId } = await auth()
 *
 *   const tasks = await withCache(
 *     async () => {
 *       return await db.select()
 *         .from(tasksTable)
 *         .where(t => t.userId === userId && t.orgId === orgId)
 *     },
 *     {
 *       key: cacheKeys.userTasks(userId),
 *       ttl: 3600, // 1 hour
 *     }
 *   )
 *
 *   return NextResponse.json({ tasks })
 * }
 */

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string): Promise<void> {
  console.log(`[Cache] INVALIDATING: ${key}`)
  await getCached(key) // This will check redis is available
  // Then delete
  const cache = await import('./redis')
  await cache.deleteCached(key)
}

/**
 * Invalidate cache by pattern
 * Useful for clearing all user data when they log out
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  console.log(`[Cache] INVALIDATING PATTERN: ${pattern}`)
  const cache = await import('./redis')
  return await cache.deletePattern(pattern)
}
