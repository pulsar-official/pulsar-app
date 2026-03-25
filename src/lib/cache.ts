import { redis } from './redis'

const DEFAULT_TTL = 300 // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL,
): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds })
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key)
}

export async function cachePrefixDelete(prefix: string): Promise<void> {
  let cursor = 0
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: `${prefix}*`,
      count: 100,
    })
    cursor = nextCursor as number
    if (keys.length > 0) {
      await redis.del(...(keys as string[]))
    }
  } while (cursor !== 0)
}

export const cacheKeys = {
  userPreferences: (userId: string) => `prefs:${userId}`,
  habitStats:      (userId: string) => `habits:stats:${userId}`,
  focusAggregate:  (userId: string) => `focus:agg:${userId}`,
  betaCount:       ()               => `beta:count`,
}
