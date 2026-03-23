import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { calEvents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const rows = await db.select().from(calEvents).where(eq(calEvents.orgId, oid))
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
  const [row] = await db.insert(calEvents).values({
    orgId: oid, userId,
    title: body.title,
    date: body.date,
    dateEnd: body.dateEnd ?? null,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    tag: body.tag ?? 'default',
    recur: body.recur ?? null,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
  const [row] = await db.update(calEvents)
    .set({
      title: body.title,
      date: body.date,
      dateEnd: body.dateEnd,
      startTime: body.startTime,
      endTime: body.endTime,
      tag: body.tag,
      recur: body.recur,
      updatedAt: new Date(),
    })
    .where(and(eq(calEvents.id, body.id), eq(calEvents.orgId, oid)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const { id } = await req.json()
  await db.delete(calEvents).where(and(eq(calEvents.id, id), eq(calEvents.orgId, oid)))
  return Response.json({ ok: true })
}
