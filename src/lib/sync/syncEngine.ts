/**
 * Client-side Sync Engine
 *
 * Creates sync operations from mutations, applies remote operations
 * via per-field LWW merge, and manages temp ID remapping.
 */

import * as HLC from './hlc'
import type { SyncOp, SyncFields, SyncEntityType, SyncOperation, PendingOp, ServerOp, SyncAckItem } from './types'

export class SyncEngine {
  private clock: HLC.HLCState
  private tempIdMap: Map<string, number> = new Map() // temp:{uuid} → real server ID

  constructor(nodeId: string) {
    this.clock = HLC.createClock(nodeId)
  }

  /** Generate a new HLC timestamp */
  tick(): string {
    HLC.increment(this.clock)
    return HLC.serialize(this.clock)
  }

  /** Receive a remote HLC to advance our clock */
  receive(remoteHlc: string): void {
    HLC.receive(this.clock, remoteHlc)
  }

  /** Create a sync op for a new entity */
  createOp(
    entityType: SyncEntityType,
    fields: Record<string, unknown>,
  ): { op: PendingOp; tempId: string } {
    const hlc = this.tick()
    const tempId = `temp:${crypto.randomUUID()}`

    const syncFields: SyncFields = {}
    for (const [key, value] of Object.entries(fields)) {
      syncFields[key] = { value, hlc }
    }

    const op: PendingOp = {
      opId: crypto.randomUUID(),
      entityType,
      entityId: tempId,
      operation: 'create',
      fields: syncFields,
      hlc,
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
    }

    return { op, tempId }
  }

  /** Create a sync op for updating an entity */
  updateOp(
    entityType: SyncEntityType,
    entityId: number,
    changedFields: Record<string, unknown>,
  ): PendingOp {
    const hlc = this.tick()

    const syncFields: SyncFields = {}
    for (const [key, value] of Object.entries(changedFields)) {
      syncFields[key] = { value, hlc }
    }

    return {
      opId: crypto.randomUUID(),
      entityType,
      entityId: String(entityId),
      operation: 'update',
      fields: syncFields,
      hlc,
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
    }
  }

  /** Create a sync op for deleting an entity */
  deleteOp(entityType: SyncEntityType, entityId: number): PendingOp {
    const hlc = this.tick()

    return {
      opId: crypto.randomUUID(),
      entityType,
      entityId: String(entityId),
      operation: 'delete',
      fields: {},
      hlc,
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
    }
  }

  /** Process a server ack — remap temp IDs and handle conflict resolutions */
  processAck(ack: SyncAckItem): { remappedId?: { tempId: string; realId: number } } {
    // Advance clock with server timestamp info
    const result: { remappedId?: { tempId: string; realId: number } } = {}

    // Handle temp ID remapping for creates
    if (ack.tempId) {
      this.tempIdMap.set(ack.tempId, ack.entityId)
      result.remappedId = { tempId: ack.tempId, realId: ack.entityId }
    }

    return result
  }

  /** Process a server op received from another device */
  processServerOp(serverOp: ServerOp): {
    entityType: SyncEntityType
    entityId: number
    operation: SyncOperation
    fields: Record<string, unknown>
  } {
    // Advance our clock
    this.receive(serverOp.hlc)

    // Extract plain values from sync fields
    const fields: Record<string, unknown> = {}
    for (const [key, fieldValue] of Object.entries(serverOp.fields)) {
      fields[key] = fieldValue.value
    }

    return {
      entityType: serverOp.entityType,
      entityId: serverOp.entityId,
      operation: serverOp.operation,
      fields,
    }
  }

  /** Get the real server ID for a temp ID, or undefined if not yet mapped */
  getRealId(tempId: string): number | undefined {
    return this.tempIdMap.get(tempId)
  }

  /** Get current clock state (for debugging) */
  getClockState(): string {
    return HLC.serialize(this.clock)
  }
}
