import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

// 20 requests per minute — AI is expensive
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'rl:ai',
})

// 120 requests per minute — sync push
export const syncRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '1 m'),
  analytics: true,
  prefix: 'rl:sync',
})

// 300 requests per minute — CRUD routes
export const crudRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(300, '1 m'),
  analytics: true,
  prefix: 'rl:crud',
})

/** Returns a 429 Response if rate limited, null if OK */
export async function checkRatelimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<Response | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    )
  }
  return null
}
