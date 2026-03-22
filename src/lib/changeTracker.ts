import { db } from './db'
import { changes } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export interface ChangeLog {
  orgId: string
  userId: string
  entityType: string
  entityId: number
  field: string
  oldValue: any
  newValue: any
  operation: 'create' | 'update' | 'delete'
  version?: number
}

/**
 * Track a change/update in the changelog
 * Used for audit trail and real-time sync
 */
export async function trackChange(data: ChangeLog) {
  try {
    await db.insert(changes).values({
      orgId: data.orgId,
      userId: data.userId,
      entityType: data.entityType,
      entityId: data.entityId,
      field: data.field,
      oldValue: typeof data.oldValue === 'string' ? data.oldValue : JSON.stringify(data.oldValue),
      newValue: typeof data.newValue === 'string' ? data.newValue : JSON.stringify(data.newValue),
      operation: data.operation,
      version: data.version || 1,
    })
  } catch (error) {
    console.error('Error tracking change:', error)
    // Don't throw - change tracking shouldn't break the main operation
  }
}

/**
 * Get changelog for a specific entity
 */
export async function getEntityChanges(
  orgId: string,
  entityType: string,
  entityId: number
) {
  return await db.select()
    .from(changes)
    .where(
      and(
        eq(changes.orgId, orgId),
        eq(changes.entityType, entityType),
        eq(changes.entityId, entityId)
      )
    )
}

/**
 * Get all changes since a specific timestamp (for sync)
 */
export async function getChangesSince(
  orgId: string,
  userId: string,
  since: Date
) {
  return await db.select()
    .from(changes)
    .where(
      and(
        eq(changes.orgId, orgId),
        eq(changes.userId, userId),
        gt(changes.createdAt, since)
      )
    )
    .orderBy(changes.createdAt)
}

/**
 * Get latest version of an entity (for conflict resolution)
 */
export async function getEntityVersion(
  entityType: string,
  entityId: number
): Promise<number> {
  const result = await db.select()
    .from(changes)
    .where(
      and(
        eq(changes.entityType, entityType),
        eq(changes.entityId, entityId)
      )
    )
    .orderBy(changes.version)
    .limit(1)

  return result[0]?.version || 1
}
