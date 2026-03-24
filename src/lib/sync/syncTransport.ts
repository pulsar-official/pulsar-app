/**
 * Sync Transport — Supabase Realtime
 *
 * Manages the bidirectional Supabase Realtime channel for an org.
 * Handles broadcast (client_ops, server_ack, server_ops),
 * presence tracking, and postgres_changes as safety net.
 */

import { getSupabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  ClientOpsPayload, ServerAckPayload, ServerOpsPayload,
  SyncPresence, SyncConnectionStatus, SyncOp,
} from './types'

export interface TransportCallbacks {
  onServerAck: (payload: ServerAckPayload) => void
  onServerOps: (payload: ServerOpsPayload) => void
  onPresenceChange: (presences: SyncPresence[]) => void
  onStatusChange: (status: SyncConnectionStatus) => void
  onPostgresChange: (payload: { table: string; eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
}

const SYNC_TABLES = [
  'tasks', 'habits', 'habit_checks', 'goals', 'goal_subs',
  'journal_entries', 'cal_events', 'boards', 'board_nodes',
  'board_threads', 'notes',
]

export class SyncTransport {
  private channel: RealtimeChannel | null = null
  private orgId: string
  private deviceId: string
  private userId: string
  private callbacks: TransportCallbacks
  private status: SyncConnectionStatus = 'disconnected'

  constructor(
    orgId: string,
    deviceId: string,
    userId: string,
    callbacks: TransportCallbacks,
  ) {
    this.orgId = orgId
    this.deviceId = deviceId
    this.userId = userId
    this.callbacks = callbacks
  }

  /** Connect to the Supabase Realtime channel */
  connect(): void {
    if (this.channel) return

    const client = getSupabase()
    if (!client) {
      console.warn('[SyncTransport] Supabase not configured, skipping Realtime connection')
      this.setStatus('disconnected')
      return
    }

    this.setStatus('connecting')

    const channel = client.channel(`sync:${this.orgId}`, {
      config: { broadcast: { self: false } },
    })

    // Listen for server acknowledgments
    channel.on('broadcast', { event: 'server_ack' }, ({ payload }: { payload: any }) => {
      const ackPayload = payload as ServerAckPayload
      // Only process acks targeted at this device
      if (ackPayload.deviceId === this.deviceId) {
        this.callbacks.onServerAck(ackPayload)
      }
    })

    // Listen for server ops (changes from other devices)
    channel.on('broadcast', { event: 'server_ops' }, ({ payload }: { payload: any }) => {
      const opsPayload = payload as ServerOpsPayload
      // Skip ops that originated from this device
      if (opsPayload.sourceDeviceId !== this.deviceId) {
        this.callbacks.onServerOps(opsPayload)
      }
    })

    // Presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presences: SyncPresence[] = []
      for (const [, entries] of Object.entries(state)) {
        for (const entry of entries as any[]) {
          presences.push({
            userId: entry.userId,
            deviceId: entry.deviceId,
            lastSeen: entry.lastSeen,
          })
        }
      }
      this.callbacks.onPresenceChange(presences)
    })

    // Postgres Changes as safety net — subscribe to all data tables
    for (const table of SYNC_TABLES) {
      channel.on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          filter: `org_id=eq.${this.orgId}`,
        } as any,
        (payload: any) => {
          this.callbacks.onPostgresChange({
            table,
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          })
        },
      )
    }

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        this.setStatus('connected')
        // Track presence
        await channel.track({
          userId: this.userId,
          deviceId: this.deviceId,
          lastSeen: new Date().toISOString(),
        })
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.setStatus('disconnected')
      }
    })

    this.channel = channel
  }

  /** Send client ops via broadcast */
  async sendOps(ops: SyncOp[]): Promise<void> {
    if (!this.channel || this.status !== 'connected') {
      throw new Error('Transport not connected')
    }

    const payload: ClientOpsPayload = {
      deviceId: this.deviceId,
      userId: this.userId,
      ops,
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'client_ops',
      payload,
    })
  }

  /** Disconnect from the channel */
  disconnect(): void {
    if (this.channel) {
      getSupabase()?.removeChannel(this.channel)
      this.channel = null
      this.setStatus('disconnected')
    }
  }

  /** Check if currently connected */
  isConnected(): boolean {
    return this.status === 'connected'
  }

  getStatus(): SyncConnectionStatus {
    return this.status
  }

  private setStatus(status: SyncConnectionStatus): void {
    this.status = status
    this.callbacks.onStatusChange(status)
  }
}
