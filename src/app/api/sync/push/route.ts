import { auth } from '@clerk/nextjs/server'
import { syncRatelimit, checkRatelimit } from '@/lib/ratelimit'
import { processOps } from '@/lib/sync/serverSyncEngine'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { SyncOp } from '@/lib/sync/types'

/**
 * POST /api/sync/push
 * HTTP fallback for pushing sync operations.
 * Used when Supabase Realtime is unavailable or for reconnect burst.
 */
export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await checkRatelimit(syncRatelimit, userId)
  if (limited) return limited

  const body = await req.json()
  const { deviceId, ops } = body as { deviceId: string; ops: SyncOp[] }

  if (!deviceId || !Array.isArray(ops) || ops.length === 0) {
    return Response.json({ error: 'deviceId and ops[] required' }, { status: 400 })
  }

  const { acks, serverOps } = await processOps(ops, orgId, userId, deviceId)

  // Broadcast server_ops to other devices via Supabase Realtime
  if (serverOps.length > 0) {
    try {
      const admin = getSupabaseAdmin()
      if (admin) {
        const channel = admin.channel(`sync:${orgId}`)
        await channel.send({
          type: 'broadcast',
          event: 'server_ops',
          payload: { sourceDeviceId: deviceId, ops: serverOps },
        })
        admin.removeChannel(channel)
      }
    } catch (err) {
      console.error('[Sync Push] Failed to broadcast server_ops:', err)
    }
  }

  return Response.json({ acks, serverHlc: String(Date.now()) })
}
