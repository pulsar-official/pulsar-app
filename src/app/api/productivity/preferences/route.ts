import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { userPreferences } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(userPreferences).where(
    and(
      eq(userPreferences.orgId, orgId),
      eq(userPreferences.userId, userId),
      or(eq(userPreferences.isDeleted, false), isNull(userPreferences.isDeleted)),
    )
  )
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.key?.trim()) return Response.json({ error: 'key required' }, { status: 400 })

  // PowerSync upsert: if clientId supplied, upsert by clientId; else upsert by key
  if (body.clientId) {
    const existing = await db.select({ id: userPreferences.id }).from(userPreferences)
      .where(eq(userPreferences.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(userPreferences)
        .set({ value: body.value, updatedAt: new Date() })
        .where(eq(userPreferences.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(userPreferences).values({
      clientId: body.clientId, orgId, userId,
      key: body.key, value: body.value ?? null,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Legacy: upsert by key
  const existing = await db.select().from(userPreferences).where(
    and(eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId), eq(userPreferences.key, body.key))
  )
  if (existing.length > 0) {
    const [row] = await db.update(userPreferences)
      .set({ value: body.value, updatedAt: new Date() })
      .where(eq(userPreferences.id, existing[0].id))
      .returning()
    return Response.json(row)
  }
  const [row] = await db.insert(userPreferences).values({
    orgId, userId, key: body.key, value: body.value ?? null,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id && !body.clientId) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = body.clientId
    ? and(eq(userPreferences.clientId, body.clientId), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId))
    : and(eq(userPreferences.id, body.id), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId))
  const [row] = await db.update(userPreferences)
    .set({ value: body.value, updatedAt: new Date() })
    .where(where!)
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const clientId = body.clientId
  const id = body.id
  if (!clientId && !id) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = clientId
    ? and(eq(userPreferences.clientId, clientId), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId))
    : and(eq(userPreferences.id, id), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId))
  await db.delete(userPreferences).where(where!)
  return Response.json({ ok: true })
}
