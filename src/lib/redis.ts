/**
 * Redis Cache Wrapper
 * Abstracts Redis operations for caching
 * Works with either @upstash/redis or redis package
 *
 * To use:
 * 1. Install: pnpm add @upstash/redis (recommended for serverless)
 * 2. Add to .env: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 3. Or use standard redis package if self-hosted
 */

// This will be null if Redis isn't configured
let redisClient: any = null
let isAvailable = false

/**
 * Initialize Redis client
 */
async function initRedis() {
  if (isAvailable) return

  try {
    // Try Upstash Redis first (best for serverless)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis')
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      isAvailable = true
      console.log('[Redis] Using Upstash Redis')
      return
    }

    // Fall back to standard redis package if available
    if (process.env.REDIS_URL) {
      const redis = await import('redis')
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
      })
      await redisClient.connect()
      isAvailable = true
      console.log('[Redis] Using standard Redis')
      return
    }

    console.warn('[Redis] No Redis configured, caching disabled')
    isAvailable = false
  } catch (error) {
    console.warn('[Redis] Failed to initialize Redis:', error)
    isAvailable = false
  }
}

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (!isAvailable) await initRedis()
    if (!redisClient) return null

    const value = await redisClient.get(key)
    if (!value) return null

    return typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    console.warn(`[Redis] Error getting key "${key}":`, error)
    return null
  }
}

/**
 * Set cached value with optional TTL (in seconds)
 */
export async function setCached(
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    if (!isAvailable) await initRedis()
    if (!redisClient) return false

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, stringValue)
    } else {
      await redisClient.set(key, stringValue)
    }

    return true
  } catch (error) {
    console.warn(`[Redis] Error setting key "${key}":`, error)
    return false
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<boolean> {
  try {
    if (!isAvailable) await initRedis()
    if (!redisClient) return false

    await redisClient.del(key)
    return true
  } catch (error) {
    console.warn(`[Redis] Error deleting key "${key}":`, error)
    return false
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function deletePattern(pattern: string): Promise<number> {
  try {
    if (!isAvailable) await initRedis()
    if (!redisClient) return 0

    const keys = await redisClient.keys(pattern)
    if (keys.length === 0) return 0

    await redisClient.del(...keys)
    return keys.length
  } catch (error) {
    console.warn(`[Redis] Error deleting pattern "${pattern}":`, error)
    return 0
  }
}

/**
 * Increment a value
 */
export async function increment(key: string, amount = 1): Promise<number> {
  try {
    if (!isAvailable) await initRedis()
    if (!redisClient) return 0

    return await redisClient.incrby(key, amount)
  } catch (error) {
    console.warn(`[Redis] Error incrementing key "${key}":`, error)
    return 0
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isAvailable && redisClient !== null
}

/**
 * Helper to build cache keys consistently
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userTasks: (userId: string) => `user:${userId}:tasks`,
  userHabits: (userId: string) => `user:${userId}:habits`,
  userGoals: (userId: string) => `user:${userId}:goals`,
  userJournal: (userId: string) => `user:${userId}:journal`,
  userEvents: (userId: string) => `user:${userId}:events`,
  userNotes: (userId: string) => `user:${userId}:notes`,
  org: (orgId: string) => `org:${orgId}`,
  orgUsers: (orgId: string) => `org:${orgId}:users`,
}
