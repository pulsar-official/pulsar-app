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

  // Upsert: if key exists, update it; otherwise insert
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
    orgId, userId,
    key: body.key,
    value: body.value ?? null,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(userPreferences)
    .set({ value: body.value, updatedAt: new Date() })
    .where(and(eq(userPreferences.id, body.id), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(userPreferences).where(
    and(eq(userPreferences.id, id), eq(userPreferences.orgId, orgId), eq(userPreferences.userId, userId))
  )
  return Response.json({ ok: true })
}
