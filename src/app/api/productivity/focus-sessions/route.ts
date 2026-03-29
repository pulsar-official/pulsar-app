import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { focusSessions } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(focusSessions).where(
    and(eq(focusSessions.orgId, orgId), or(eq(focusSessions.isDeleted, false), isNull(focusSessions.isDeleted)))
  )
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.date?.trim()) return Response.json({ error: 'date required' }, { status: 400 })

  // PowerSync upsert
  if (body.clientId) {
    const existing = await db.select({ id: focusSessions.id }).from(focusSessions)
      .where(eq(focusSessions.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(focusSessions)
        .set({
          completedCycles: body.completedCycles ?? 0,
          completedTasks: body.completedTasks ?? 0,
          totalFocusSeconds: body.totalFocusSeconds ?? 0,
          isPublic: body.isPublic ?? false, updatedAt: new Date(),
        })
        .where(eq(focusSessions.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(focusSessions).values({
      clientId: body.clientId, orgId, userId,
      date: body.date, timerType: body.timerType ?? 'pomodoro',
      totalCycles: body.totalCycles ?? 4, completedCycles: body.completedCycles ?? 0,
      workMinutes: body.workMinutes ?? 25, restMinutes: body.restMinutes ?? 5,
      longRestMinutes: body.longRestMinutes ?? 15,
      completedTasks: body.completedTasks ?? 0,
      totalFocusSeconds: body.totalFocusSeconds ?? 0,
      isPublic: body.isPublic ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  const [row] = await db.insert(focusSessions).values({
    orgId, userId, date: body.date,
    timerType: body.timerType ?? 'pomodoro',
    totalCycles: body.totalCycles ?? 4, completedCycles: body.completedCycles ?? 0,
    workMinutes: body.workMinutes ?? 25, restMinutes: body.restMinutes ?? 5,
    longRestMinutes: body.longRestMinutes ?? 15,
    completedTasks: body.completedTasks ?? 0,
    totalFocusSeconds: body.totalFocusSeconds ?? 0,
    isPublic: body.isPublic ?? false,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id && !body.clientId) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = body.clientId
    ? and(eq(focusSessions.clientId, body.clientId), eq(focusSessions.orgId, orgId))
    : and(eq(focusSessions.id, body.id), eq(focusSessions.orgId, orgId))
  const [row] = await db.update(focusSessions)
    .set({
      timerType: body.timerType, totalCycles: body.totalCycles,
      completedCycles: body.completedCycles, workMinutes: body.workMinutes,
      restMinutes: body.restMinutes, longRestMinutes: body.longRestMinutes,
      completedTasks: body.completedTasks, totalFocusSeconds: body.totalFocusSeconds,
      isPublic: body.isPublic, updatedAt: new Date(),
    })
    .where(where!)
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const clientId = body.clientId
  const id = body.id
  if (!clientId && !id) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = clientId
    ? and(eq(focusSessions.clientId, clientId), eq(focusSessions.orgId, orgId))
    : and(eq(focusSessions.id, id), eq(focusSessions.orgId, orgId))
  await db.delete(focusSessions).where(where!)
  return Response.json({ ok: true })
}
