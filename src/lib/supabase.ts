import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Lazy Supabase clients — only created when first accessed.
 * This prevents crashes when env vars aren't set (build time, missing config).
 */

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _supabase = createClient(url, key)
  return _supabase
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _supabaseAdmin = createClient(url, key)
  return _supabaseAdmin
}

// Backward-compat exports (lazy getters)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase()
    if (!client) {
      if (prop === 'channel' || prop === 'removeChannel') {
        // Return no-ops when Supabase isn't configured
        return () => null
      }
      return undefined
    }
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin()
    if (!client) {
      if (prop === 'channel' || prop === 'removeChannel') {
        return () => null
      }
      return undefined
    }
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
