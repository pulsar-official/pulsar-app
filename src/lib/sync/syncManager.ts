/**
 * Sync Manager — Orchestrator
 *
 * Coordinates SyncEngine + SyncStorage + SyncTransport.
 * Handles online/offline transitions, reconnect flow, and ack timeouts.
 */

import { SyncEngine } from './syncEngine'
import { SyncTransport, type TransportCallbacks } from './syncTransport'
import * as Storage from './syncStorage'
import type {
  SyncEntityType, SyncOp, PendingOp, SyncConnectionStatus,
  SyncPresence, ServerAckPayload, ServerOpsPayload, SyncAckItem,
} from './types'

const ACK_TIMEOUT_MS = 3000

export type SyncEventHandler = {
  onStatusChange?: (status: SyncConnectionStatus) => void
  onPresenceChange?: (presences: SyncPresence[]) => void
  onRemoteChange?: (change: RemoteChange) => void
  onSyncComplete?: () => void
  onError?: (error: Error) => void
}

export interface RemoteChange {
  entityType: SyncEntityType
  entityId: number
  operation: 'create' | 'update' | 'delete'
  fields: Record<string, unknown>
}

export class SyncManager {
  private engine: SyncEngine
  private transport: SyncTransport | null = null
  private orgId: string
  private userId: string
  private deviceId: string
  private eventHandler: SyncEventHandler
  private pendingAcks: Map<string, { resolve: () => void; timeout: NodeJS.Timeout }> = new Map()
  private isReconnecting = false

  constructor(
    orgId: string,
    userId: string,
    deviceId: string,
    eventHandler: SyncEventHandler = {},
  ) {
    this.orgId = orgId
    this.userId = userId
    this.deviceId = deviceId
    this.engine = new SyncEngine(deviceId)
    this.eventHandler = eventHandler
  }

  /** Start the sync system — connect transport and set up listeners */
  start(): void {
    const callbacks: TransportCallbacks = {
      onServerAck: (payload) => this.handleServerAck(payload),
      onServerOps: (payload) => this.handleServerOps(payload),
      onPresenceChange: (presences) => this.eventHandler.onPresenceChange?.(presences),
      onStatusChange: (status) => {
        this.eventHandler.onStatusChange?.(status)
        if (status === 'connected' && !this.isReconnecting) {
          this.reconnect()
        }
      },
      onPostgresChange: () => {
        // Safety net: postgres_changes are deduped by the store
        // We rely on server_ops for primary sync
      },
    }

    this.transport = new SyncTransport(this.orgId, this.deviceId, this.userId, callbacks)
    this.transport.connect()

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.reconnect())
    }
  }

  /** Stop the sync system */
  stop(): void {
    this.transport?.disconnect()
    this.transport = null
    for (const { timeout } of this.pendingAcks.values()) {
      clearTimeout(timeout)
    }
    this.pendingAcks.clear()
  }

  /** Create a new entity — returns temp ID for optimistic update */
  async create(
    entityType: SyncEntityType,
    fields: Record<string, unknown>,
  ): Promise<{ tempId: string; op: PendingOp }> {
    const { op, tempId } = this.engine.createOp(entityType, fields)
    await Storage.addPendingOp(op)
    this.sendOrQueue(op)
    return { tempId, op }
  }

  /** Update an entity */
  async update(
    entityType: SyncEntityType,
    entityId: number,
    changedFields: Record<string, unknown>,
  ): Promise<PendingOp> {
    const op = this.engine.updateOp(entityType, entityId, changedFields)
    await Storage.addPendingOp(op)
    this.sendOrQueue(op)
    return op
  }

  /** Delete an entity (soft-delete) */
  async delete(
    entityType: SyncEntityType,
    entityId: number,
  ): Promise<PendingOp> {
    const op = this.engine.deleteOp(entityType, entityId)
    await Storage.addPendingOp(op)
    this.sendOrQueue(op)
    return op
  }

  /** Reconnect flow: catch-up pull then push pending ops */
  async reconnect(): Promise<void> {
    if (this.isReconnecting) return
    this.isReconnecting = true

    try {
      // Phase 1: Catch-up pull
      await this.pullCatchUp()

      // Phase 2: Push pending ops
      await this.pushPendingOps()

      this.eventHandler.onSyncComplete?.()
    } catch (error) {
      this.eventHandler.onError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.isReconnecting = false
    }
  }

  /** Get the real server ID for a temp ID */
  getRealId(tempId: string): number | undefined {
    return this.engine.getRealId(tempId)
  }

  isConnected(): boolean {
    return this.transport?.isConnected() ?? false
  }

  /* ── Private methods ── */

  private async sendOrQueue(op: PendingOp): Promise<void> {
    if (!this.transport?.isConnected()) return // stays queued in IndexedDB

    try {
      await this.transport.sendOps([op])
      this.waitForAck(op.opId)
    } catch {
      // Will be retried on reconnect
    }
  }

  private waitForAck(opId: string): void {
    const timeout = setTimeout(() => {
      // Ack timeout — fall back to HTTP push
      this.pendingAcks.delete(opId)
      this.httpPushOp(opId)
    }, ACK_TIMEOUT_MS)

    this.pendingAcks.set(opId, {
      resolve: () => clearTimeout(timeout),
      timeout,
    })
  }

  private async httpPushOp(opId: string): Promise<void> {
    try {
      const pendingOps = await Storage.getPendingOps()
      const op = pendingOps.find(o => o.opId === opId)
      if (!op) return

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          ops: [op],
        }),
      })

      if (res.ok) {
        const { acks } = await res.json()
        for (const ack of acks as SyncAckItem[]) {
          this.processAck(ack)
        }
      }
    } catch (error) {
      console.error('[SyncManager] HTTP push failed:', error)
    }
  }

  private handleServerAck(payload: ServerAckPayload): void {
    // Advance clock
    this.engine.receive(payload.serverHlc)

    for (const ack of payload.acks) {
      this.processAck(ack)
    }
  }

  private processAck(ack: SyncAckItem): void {
    // Clear pending ack timeout
    const pending = this.pendingAcks.get(ack.opId)
    if (pending) {
      pending.resolve()
      this.pendingAcks.delete(ack.opId)
    }

    // Mark op as synced
    Storage.markOpSynced(ack.opId)

    // Process ID remapping and conflict resolution
    const result = this.engine.processAck(ack)

    if (result.remappedId) {
      this.eventHandler.onRemoteChange?.({
        entityType: 'task', // Will be overridden by actual data
        entityId: result.remappedId.realId,
        operation: 'create',
        fields: { _tempIdRemap: { from: result.remappedId.tempId, to: result.remappedId.realId } },
      })
    }

    if (ack.status === 'conflict_resolved' && ack.resolvedFields) {
      // Server won some fields — apply resolved values
      const fields: Record<string, unknown> = {}
      for (const [key, fv] of Object.entries(ack.resolvedFields)) {
        fields[key] = fv.value
      }
      this.eventHandler.onRemoteChange?.({
        entityType: 'task', // resolved from the op context
        entityId: ack.entityId,
        operation: 'update',
        fields,
      })
    }
  }

  private handleServerOps(payload: ServerOpsPayload): void {
    for (const serverOp of payload.ops) {
      const change = this.engine.processServerOp(serverOp)
      this.eventHandler.onRemoteChange?.(change)

      // Update cursor
      Storage.setCursor(this.orgId, serverOp.serverSeq)
    }
  }

  private async pullCatchUp(): Promise<void> {
    const cursor = await Storage.getCursor(this.orgId)

    let hasMore = true
    let currentCursor = cursor

    while (hasMore) {
      const res = await fetch('/api/sync/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          cursor: currentCursor,
        }),
      })

      if (!res.ok) throw new Error(`Pull failed: ${res.status}`)

      const data = await res.json()

      // Apply each remote op
      for (const op of data.ops) {
        if (op.fields) {
          const fields: Record<string, unknown> = {}
          for (const [key, fv] of Object.entries(op.fields as Record<string, { value: unknown }>)) {
            fields[key] = fv.value
          }
          this.eventHandler.onRemoteChange?.({
            entityType: op.entityType,
            entityId: parseInt(op.entityId, 10),
            operation: op.operation,
            fields,
          })
        }
        if (op.hlc) this.engine.receive(op.hlc)
      }

      currentCursor = data.cursor
      hasMore = data.hasMore
      await Storage.setCursor(this.orgId, currentCursor)
    }
  }

  private async pushPendingOps(): Promise<void> {
    const pendingOps = await Storage.getPendingOps()
    if (pendingOps.length === 0) return

    if (this.transport?.isConnected()) {
      // Try Realtime first
      try {
        await this.transport.sendOps(pendingOps)
        for (const op of pendingOps) {
          this.waitForAck(op.opId)
        }
        return
      } catch {
        // Fall through to HTTP
      }
    }

    // HTTP fallback
    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          ops: pendingOps,
        }),
      })

      if (res.ok) {
        const { acks } = await res.json()
        for (const ack of acks as SyncAckItem[]) {
          this.processAck(ack)
        }
      }
    } catch (error) {
      console.error('[SyncManager] HTTP push pending ops failed:', error)
    }
  }
}
