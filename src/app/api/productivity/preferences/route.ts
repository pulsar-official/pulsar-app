import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { userPreferences } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'
import { crudRatelimit, checkRatelimit } from '@/lib/ratelimit'
import { cacheGet, cacheSet, cacheDelete, cacheKeys } from '@/lib/cache'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Serve from cache if available
  const cached = await cacheGet(cacheKeys.userPreferences(userId))
  if (cached) return Response.json(cached)

  const rows = await db.select().from(userPreferences).where(
    and(
      eq(userPreferences.orgId, orgId),
      eq(userPreferences.userId, userId),
      or(eq(userPreferences.isDeleted, false), isNull(userPreferences.isDeleted)),
    )
  )

  // Cache for 1 hour — preferences change infrequently
  await cacheSet(cacheKeys.userPreferences(userId), rows, 3600)
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()
  if (!body.key?.trim()) return Response.json({ error: 'key required' }, { status: 400 })

  // Upsert: if key exists, update it; otherwise insert
  const existing = await db.select().from(userPreferences).where(
    and(eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId), eq(userPreferences.key, body.key))
  )

  let row
  if (existing.length > 0) {
    ;[row] = await db.update(userPreferences)
      .set({ value: body.value, updatedAt: new Date() })
      .where(eq(userPreferences.id, existing[0].id))
      .returning()
  } else {
    ;[row] = await db.insert(userPreferences).values({
      orgId, userId,
      key: body.key,
      value: body.value ?? null,
    }).returning()
  }

  await cacheDelete(cacheKeys.userPreferences(userId))
  return Response.json(row, { status: existing.length > 0 ? 200 : 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(userPreferences)
    .set({ value: body.value, updatedAt: new Date() })
    .where(and(eq(userPreferences.id, body.id), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  await cacheDelete(cacheKeys.userPreferences(userId))
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(userPreferences).where(
    and(eq(userPreferences.id, id), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId))
  )
  await cacheDelete(cacheKeys.userPreferences(userId))
  return Response.json({ ok: true })
}
