/**
 * Server-side Realtime Listener
 *
 * Subscribes to Supabase Realtime channels to receive client_ops broadcasts.
 * Routes them to the ServerSyncEngine for processing.
 *
 * Designed to run as a singleton via Next.js instrumentation.ts.
 * For serverless (Vercel), clients use HTTP fallback instead.
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { processOps } from './serverSyncEngine'
import type { ClientOpsPayload, ServerAckPayload, ServerOpsPayload } from './types'

const activeChannels = new Map<string, any>()

/**
 * Start listening on a channel for a specific org.
 * Called lazily when the first client connects.
 */
export function listenToOrg(orgId: string): void {
  if (activeChannels.has(orgId)) return

  const admin = getSupabaseAdmin()
  if (!admin) {
    console.warn('[RealtimeListener] Supabase not configured, skipping org listener')
    return
  }

  const channel = admin.channel(`sync:${orgId}`, {
    config: { broadcast: { self: true } },
  })

  channel.on('broadcast', { event: 'client_ops' }, async ({ payload }: { payload: any }) => {
    const { deviceId, userId, ops } = payload as ClientOpsPayload

    try {
      const { acks, serverOps } = await processOps(ops, orgId, userId, deviceId)

      // Send ack back to originating device
      const ackPayload: ServerAckPayload = {
        deviceId,
        acks,
        serverHlc: String(Date.now()),
      }

      await channel.send({
        type: 'broadcast',
        event: 'server_ack',
        payload: ackPayload,
      })

      // Broadcast ops to all other devices
      if (serverOps.length > 0) {
        const opsPayload: ServerOpsPayload = {
          sourceDeviceId: deviceId,
          ops: serverOps,
        }

        await channel.send({
          type: 'broadcast',
          event: 'server_ops',
          payload: opsPayload,
        })
      }
    } catch (error) {
      console.error(`[RealtimeListener] Error processing ops for org ${orgId}:`, error)
    }
  })

  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[RealtimeListener] Subscribed to sync:${orgId}`)
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      console.warn(`[RealtimeListener] Channel sync:${orgId} status: ${status}`)
      activeChannels.delete(orgId)
    }
  })

  activeChannels.set(orgId, channel)
}

/**
 * Stop listening to a specific org channel.
 */
export function stopListeningToOrg(orgId: string): void {
  const channel = activeChannels.get(orgId)
  if (channel) {
    getSupabaseAdmin()?.removeChannel(channel)
    activeChannels.delete(orgId)
  }
}

/**
 * Initialize the Realtime listener system.
 * Called from instrumentation.ts on server startup.
 */
export function initRealtimeListener(): void {
  console.log('[RealtimeListener] Initialized — channels will be created on demand')
  // Channels are created lazily when clients connect.
  // In a production system, you'd track active orgs and subscribe to them.
}
