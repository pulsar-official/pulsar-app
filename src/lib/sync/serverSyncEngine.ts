/**
 * Server-side Sync Engine
 *
 * Validates incoming sync operations, resolves conflicts via per-field LWW,
 * writes to PostgreSQL, records to sync_operations log, and builds ack payloads.
 */

import { db } from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { syncOperations } from '@/db/schema'
import * as HLC from './hlc'
import type {
  SyncOp, SyncFields, SyncFieldValue, SyncAckItem, SyncEntityType,
  ServerOp, ENTITY_TABLE_MAP,
} from './types'

/** Map entity types to their Drizzle table references */
const TABLE_MAP = {
  task: schema.tasks,
  habit: schema.habits,
  habitCheck: schema.habitChecks,
  goal: schema.goals,
  goalSub: schema.goalSubs,
  journal: schema.journalEntries,
  event: schema.calEvents,
  board: schema.boards,
  boardNode: schema.boardNodes,
  boardThread: schema.boardThreads,
  note: schema.notes,
  focusSession: schema.focusSessions,
  userPreference: schema.userPreferences,
} as const

/** Map sync field names to Drizzle column names for each entity */
const FIELD_COLUMN_MAP: Record<SyncEntityType, Record<string, string>> = {
  task: {
    title: 'title', description: 'description', completed: 'completed',
    priority: 'priority', tag: 'tag', status: 'status', dueDate: 'due_date',
  },
  habit: { name: 'name', emoji: 'emoji', sortOrder: 'sort_order' },
  habitCheck: { habitId: 'habit_id', date: 'date', checked: 'checked' },
  goal: {
    title: 'title', description: 'description', category: 'category',
    priority: 'priority', deadline: 'deadline', done: 'done', progress: 'progress',
  },
  goalSub: { goalId: 'goal_id', text: 'text', done: 'done' },
  journal: {
    title: 'title', content: 'content', date: 'date', mood: 'mood', tags: 'tags',
  },
  event: {
    title: 'title', date: 'date', dateEnd: 'date_end', startTime: 'start_time',
    endTime: 'end_time', tag: 'tag', recur: 'recur',
  },
  board: { name: 'name', description: 'description', color: 'color', icon: 'icon' },
  boardNode: {
    boardId: 'board_id', type: 'type', title: 'title', body: 'body',
    x: 'x', y: 'y', status: 'status', priority: 'priority',
  },
  boardThread: {
    boardId: 'board_id', fromNodeId: 'from_node_id', toNodeId: 'to_node_id', label: 'label',
  },
  note: { title: 'title', content: 'content', isPublic: 'is_public', tags: 'tags' },
  focusSession: {
    date: 'date', timerType: 'timer_type', totalCycles: 'total_cycles',
    completedCycles: 'completed_cycles', workMinutes: 'work_minutes',
    restMinutes: 'rest_minutes', longRestMinutes: 'long_rest_minutes',
    completedTasks: 'completed_tasks', totalFocusSeconds: 'total_focus_seconds',
  },
  userPreference: { key: 'key', value: 'value' },
}

/** Fields that require orgId/userId context on create */
const ORG_SCOPED_ENTITIES: SyncEntityType[] = [
  'task', 'habit', 'goal', 'journal', 'event', 'board', 'note', 'focusSession', 'userPreference',
]

interface ProcessResult {
  acks: SyncAckItem[]
  serverOps: ServerOp[]
}

/**
 * Process a batch of sync operations from a client.
 * Returns acks for the originating client and ops for fan-out to other clients.
 */
export async function processOps(
  ops: SyncOp[],
  orgId: string,
  userId: string,
  deviceId: string,
): Promise<ProcessResult> {
  const acks: SyncAckItem[] = []
  const serverOps: ServerOp[] = []

  for (const op of ops) {
    try {
      const result = await processOp(op, orgId, userId, deviceId)
      acks.push(result.ack)
      if (result.serverOp) serverOps.push(result.serverOp)
    } catch (error) {
      acks.push({
        opId: op.opId,
        status: 'rejected',
        entityId: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return { acks, serverOps }
}

async function processOp(
  op: SyncOp,
  orgId: string,
  userId: string,
  deviceId: string,
): Promise<{ ack: SyncAckItem; serverOp: ServerOp | null }> {
  switch (op.operation) {
    case 'create':
      return processCreate(op, orgId, userId, deviceId)
    case 'update':
      return processUpdate(op, orgId, userId, deviceId)
    case 'delete':
      return processDelete(op, orgId, userId, deviceId)
    default:
      throw new Error(`Unknown operation: ${op.operation}`)
  }
}

async function processCreate(
  op: SyncOp,
  orgId: string,
  userId: string,
  deviceId: string,
): Promise<{ ack: SyncAckItem; serverOp: ServerOp | null }> {
  const table = TABLE_MAP[op.entityType]
  if (!table) throw new Error(`Unknown entity type: ${op.entityType}`)

  // Build insert values from op fields
  const values: Record<string, unknown> = {}
  const fieldColumns = FIELD_COLUMN_MAP[op.entityType]

  for (const [fieldName, fieldValue] of Object.entries(op.fields)) {
    const colName = fieldColumns[fieldName]
    if (colName) {
      values[fieldName] = fieldValue.value
    }
  }

  // Add org/user context for org-scoped entities
  if (ORG_SCOPED_ENTITIES.includes(op.entityType)) {
    values.orgId = orgId
    values.userId = userId
  }

  // Add sync metadata
  values.hlcTimestamp = op.hlc
  values.syncVersion = 1
  values.isDeleted = false

  // Insert and get the real ID
  const [row] = await db.insert(table as any).values(values).returning({ id: (table as any).id })

  const entityId = row.id

  // Record in sync_operations log
  const [syncOp] = await db.insert(syncOperations).values({
    opId: op.opId,
    orgId,
    userId,
    deviceId,
    entityType: op.entityType,
    entityId: String(entityId),
    operation: 'create',
    fields: op.fields as any,
    hlc: op.hlc,
    status: 'applied',
  }).returning({ serverSeq: syncOperations.serverSeq })

  const ack: SyncAckItem = {
    opId: op.opId,
    status: 'applied',
    entityId,
    tempId: op.entityId.startsWith('temp:') ? op.entityId : undefined,
  }

  const serverOp: ServerOp = {
    entityType: op.entityType,
    entityId,
    operation: 'create',
    fields: op.fields,
    hlc: op.hlc,
    serverSeq: syncOp.serverSeq,
  }

  return { ack, serverOp }
}

async function processUpdate(
  op: SyncOp,
  orgId: string,
  userId: string,
  deviceId: string,
): Promise<{ ack: SyncAckItem; serverOp: ServerOp | null }> {
  const table = TABLE_MAP[op.entityType]
  if (!table) throw new Error(`Unknown entity type: ${op.entityType}`)

  const entityId = parseInt(op.entityId, 10)
  if (isNaN(entityId)) throw new Error(`Invalid entityId for update: ${op.entityId}`)

  // Get the last sync_operations for this entity to compare field HLCs
  const existingOps = await db.select()
    .from(syncOperations)
    .where(
      and(
        eq(syncOperations.entityType, op.entityType),
        eq(syncOperations.entityId, String(entityId)),
      )
    )

  // Build a map of the most recent HLC per field from existing ops
  const currentFieldHlcs: Record<string, string> = {}
  for (const existingOp of existingOps) {
    const fields = existingOp.fields as SyncFields | null
    if (!fields) continue
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      const existing = currentFieldHlcs[fieldName]
      if (!existing || HLC.compare(fieldValue.hlc, existing) > 0) {
        currentFieldHlcs[fieldName] = fieldValue.hlc
      }
    }
  }

  // Per-field LWW conflict resolution
  const acceptedFields: SyncFields = {}
  const resolvedFields: SyncFields = {} // fields where server wins
  let hasConflict = false

  for (const [fieldName, fieldValue] of Object.entries(op.fields)) {
    const currentHlc = currentFieldHlcs[fieldName]
    if (!currentHlc || HLC.compare(fieldValue.hlc, currentHlc) > 0) {
      // Client wins
      acceptedFields[fieldName] = fieldValue
    } else {
      // Server wins — mark as conflict
      hasConflict = true
      // We need to get the server's current value for this field
      // Find it from the most recent op that set this field
      for (const existingOp of existingOps) {
        const fields = existingOp.fields as SyncFields | null
        if (fields?.[fieldName]?.hlc === currentHlc) {
          resolvedFields[fieldName] = fields[fieldName]
          break
        }
      }
    }
  }

  // Build update set from accepted fields
  const fieldColumns = FIELD_COLUMN_MAP[op.entityType]
  const updateSet: Record<string, unknown> = { updatedAt: new Date() }
  let hasUpdates = false

  for (const [fieldName, fieldValue] of Object.entries(acceptedFields)) {
    const colName = fieldColumns[fieldName]
    if (colName) {
      updateSet[fieldName] = fieldValue.value
      hasUpdates = true
    }
  }

  if (hasUpdates) {
    // Update HLC to the max of accepted field HLCs
    const maxHlc = Object.values(acceptedFields).reduce(
      (max, fv) => HLC.compare(fv.hlc, max) > 0 ? fv.hlc : max,
      ''
    )
    updateSet.hlcTimestamp = maxHlc
    updateSet.syncVersion = sql`${(table as any).syncVersion} + 1`

    await db.update(table as any)
      .set(updateSet)
      .where(eq((table as any).id, entityId))
  }

  // Record in sync_operations (even if no fields accepted — for audit)
  const [syncOp] = await db.insert(syncOperations).values({
    opId: op.opId,
    orgId,
    userId,
    deviceId,
    entityType: op.entityType,
    entityId: String(entityId),
    operation: 'update',
    fields: acceptedFields as any,
    hlc: op.hlc,
    status: hasConflict ? 'conflict_resolved' : 'applied',
  }).returning({ serverSeq: syncOperations.serverSeq })

  const ack: SyncAckItem = {
    opId: op.opId,
    status: hasConflict ? 'conflict_resolved' : 'applied',
    entityId,
    resolvedFields: hasConflict ? resolvedFields : undefined,
  }

  const serverOp: ServerOp = {
    entityType: op.entityType,
    entityId,
    operation: 'update',
    fields: acceptedFields,
    hlc: op.hlc,
    serverSeq: syncOp.serverSeq,
  }

  return { ack, serverOp }
}

async function processDelete(
  op: SyncOp,
  orgId: string,
  userId: string,
  deviceId: string,
): Promise<{ ack: SyncAckItem; serverOp: ServerOp | null }> {
  const table = TABLE_MAP[op.entityType]
  if (!table) throw new Error(`Unknown entity type: ${op.entityType}`)

  const entityId = parseInt(op.entityId, 10)
  if (isNaN(entityId)) throw new Error(`Invalid entityId for delete: ${op.entityId}`)

  // Soft-delete: set isDeleted = true
  await db.update(table as any)
    .set({
      isDeleted: true,
      hlcTimestamp: op.hlc,
      syncVersion: sql`${(table as any).syncVersion} + 1`,
      ...(('updatedAt' in (table as any)) ? { updatedAt: new Date() } : {}),
    })
    .where(eq((table as any).id, entityId))

  // Record in sync_operations
  const [syncOp] = await db.insert(syncOperations).values({
    opId: op.opId,
    orgId,
    userId,
    deviceId,
    entityType: op.entityType,
    entityId: String(entityId),
    operation: 'delete',
    fields: {} as any,
    hlc: op.hlc,
    status: 'applied',
  }).returning({ serverSeq: syncOperations.serverSeq })

  return {
    ack: { opId: op.opId, status: 'applied', entityId },
    serverOp: {
      entityType: op.entityType,
      entityId,
      operation: 'delete',
      fields: {},
      hlc: op.hlc,
      serverSeq: syncOp.serverSeq,
    },
  }
}
