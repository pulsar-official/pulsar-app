import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { syncOperations, syncCursors } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'

/**
 * POST /api/sync/pull
 * Returns all sync_operations since a given cursor for catch-up after offline.
 */
export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { deviceId, cursor = 0 } = body as { deviceId: string; cursor: number }

  if (!deviceId) {
    return Response.json({ error: 'deviceId required' }, { status: 400 })
  }

  // Fetch all ops after the cursor for this org
  const ops = await db.select()
    .from(syncOperations)
    .where(
      and(
        eq(syncOperations.orgId, orgId),
        gt(syncOperations.serverSeq, cursor),
      )
    )
    .orderBy(syncOperations.serverSeq)
    .limit(1000) // cap per request

  // Update the device's cursor
  const maxSeq = ops.length > 0 ? ops[ops.length - 1].serverSeq : cursor
  await db.insert(syncCursors)
    .values({ orgId, userId, deviceId, lastSeq: maxSeq })
    .onConflictDoUpdate({
      target: [syncCursors.orgId, syncCursors.deviceId],
      set: { lastSeq: maxSeq, updatedAt: new Date() },
    })

  return Response.json({
    ops,
    cursor: maxSeq,
    hasMore: ops.length === 1000,
  })
}
