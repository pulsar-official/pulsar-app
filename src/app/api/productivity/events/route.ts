import { getOrgAndUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { calEvents } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(calEvents).where(
    and(eq(calEvents.orgId, orgId), or(eq(calEvents.isDeleted, false), isNull(calEvents.isDeleted)))
  )
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
  if (!body.date) return Response.json({ error: 'date required' }, { status: 400 })

  // PowerSync upsert
  if (body.clientId) {
    const existing = await db.select({ id: calEvents.id }).from(calEvents)
      .where(eq(calEvents.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(calEvents)
        .set({
          title: body.title, date: body.date, dateEnd: body.dateEnd ?? null,
          startTime: body.startTime ?? null, endTime: body.endTime ?? null,
          tag: body.tag ?? 'default', recur: body.recur ?? null,
          isPublic: body.isPublic ?? false, updatedAt: new Date(),
        })
        .where(eq(calEvents.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(calEvents).values({
      clientId: body.clientId, orgId, userId,
      title: body.title, date: body.date, dateEnd: body.dateEnd ?? null,
      startTime: body.startTime ?? null, endTime: body.endTime ?? null,
      tag: body.tag ?? 'default', recur: body.recur ?? null,
      isPublic: body.isPublic ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  const [row] = await db.insert(calEvents).values({
    orgId, userId, title: body.title, date: body.date,
    dateEnd: body.dateEnd ?? null, startTime: body.startTime ?? null,
    endTime: body.endTime ?? null, tag: body.tag ?? 'default',
    recur: body.recur ?? null, isPublic: body.isPublic ?? false,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id && !body.clientId) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = body.clientId
    ? and(eq(calEvents.clientId, body.clientId), eq(calEvents.orgId, orgId))
    : and(eq(calEvents.id, body.id), eq(calEvents.orgId, orgId))
  const [row] = await db.update(calEvents)
    .set({
      title: body.title, date: body.date, dateEnd: body.dateEnd,
      startTime: body.startTime, endTime: body.endTime,
      tag: body.tag, recur: body.recur,
      isPublic: body.isPublic, updatedAt: new Date(),
    })
    .where(where!)
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const clientId = body.clientId
  const id = body.id
  if (!clientId && !id) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = clientId
    ? and(eq(calEvents.clientId, clientId), eq(calEvents.orgId, orgId))
    : and(eq(calEvents.id, id), eq(calEvents.orgId, orgId))
  const isDeleted = body.isDeleted !== false
  await db.update(calEvents).set({ isDeleted, updatedAt: new Date() }).where(where!)
  return Response.json({ ok: true })
}
