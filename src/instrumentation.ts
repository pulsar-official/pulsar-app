/**
 * Next.js Instrumentation Hook
 *
 * Runs once when the server starts. Used to initialize the
 * Supabase Realtime listener for bidirectional sync.
 *
 * Note: In serverless environments (Vercel), this runs per cold start.
 * Clients fall back to HTTP push/pull for reliability.
 */

export async function register() {
  // Only run on the server (not during build or in Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initRealtimeListener } = await import('@/lib/sync/realtimeListener')
    initRealtimeListener()
    console.log('[Instrumentation] Sync Realtime listener initialized')
  }
}
