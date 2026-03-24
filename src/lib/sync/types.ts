/* ── Sync System Types ── */

/** Entity types that participate in sync */
export type SyncEntityType =
  | 'task'
  | 'habit'
  | 'habitCheck'
  | 'goal'
  | 'goalSub'
  | 'journal'
  | 'event'
  | 'board'
  | 'boardNode'
  | 'boardThread'
  | 'note'

/** CRUD operation type */
export type SyncOperation = 'create' | 'update' | 'delete'

/** A field value with its HLC timestamp */
export interface SyncFieldValue {
  value: unknown
  hlc: string
}

/** Fields map: field name → value + HLC */
export type SyncFields = Record<string, SyncFieldValue>

/** A single sync operation (client-generated) */
export interface SyncOp {
  opId: string
  entityType: SyncEntityType
  entityId: string // server ID or "temp:{uuid}" for creates
  operation: SyncOperation
  fields: SyncFields
  hlc: string // op-level HLC (max of all field HLCs)
}

/** Payload broadcasted from client → server */
export interface ClientOpsPayload {
  deviceId: string
  userId: string
  ops: SyncOp[]
}

/** Status of a processed operation */
export type SyncAckStatus = 'applied' | 'conflict_resolved' | 'rejected'

/** Single ack for one operation */
export interface SyncAckItem {
  opId: string
  status: SyncAckStatus
  entityId: number        // real server ID
  tempId?: string         // temp ID if it was a create
  resolvedFields?: SyncFields // fields server kept during conflict resolution
  error?: string
}

/** Server → originating client ack payload */
export interface ServerAckPayload {
  deviceId: string
  acks: SyncAckItem[]
  serverHlc: string
}

/** A server-processed operation for fan-out to other devices */
export interface ServerOp {
  entityType: SyncEntityType
  entityId: number
  operation: SyncOperation
  fields: SyncFields
  hlc: string
  serverSeq: number
}

/** Server → all other clients payload */
export interface ServerOpsPayload {
  sourceDeviceId: string
  ops: ServerOp[]
}

/** Presence data tracked per device */
export interface SyncPresence {
  userId: string
  deviceId: string
  lastSeen: string
}

/** Pending operation stored in IndexedDB */
export interface PendingOp extends SyncOp {
  status: 'pending' | 'synced' | 'failed'
  createdAt: number
  attempts: number
}

/** Sync cursor for catch-up */
export interface SyncCursor {
  orgId: string
  deviceId: string
  lastSeq: number
}

/** Sync transport connection status */
export type SyncConnectionStatus = 'connected' | 'connecting' | 'disconnected'

/** Events emitted by SyncManager */
export interface SyncEvents {
  onStatusChange: (status: SyncConnectionStatus) => void
  onPresenceChange: (presence: SyncPresence[]) => void
  onSyncComplete: () => void
  onConflict: (op: SyncOp, resolved: SyncFields) => void
  onError: (error: Error) => void
}

/** Map of entity type to Drizzle table name */
export const ENTITY_TABLE_MAP: Record<SyncEntityType, string> = {
  task: 'tasks',
  habit: 'habits',
  habitCheck: 'habit_checks',
  goal: 'goals',
  goalSub: 'goal_subs',
  journal: 'journal_entries',
  event: 'cal_events',
  board: 'boards',
  boardNode: 'board_nodes',
  boardThread: 'board_threads',
  note: 'notes',
}
