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
  const [row] = await db.insert(focusSessions).values({
    orgId, userId,
    date: body.date,
    timerType: body.timerType ?? 'pomodoro',
    totalCycles: body.totalCycles ?? 4,
    completedCycles: body.completedCycles ?? 0,
    workMinutes: body.workMinutes ?? 25,
    restMinutes: body.restMinutes ?? 5,
    longRestMinutes: body.longRestMinutes ?? 15,
    completedTasks: body.completedTasks ?? 0,
    totalFocusSeconds: body.totalFocusSeconds ?? 0,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(focusSessions)
    .set({
      timerType: body.timerType,
      totalCycles: body.totalCycles,
      completedCycles: body.completedCycles,
      workMinutes: body.workMinutes,
      restMinutes: body.restMinutes,
      longRestMinutes: body.longRestMinutes,
      completedTasks: body.completedTasks,
      totalFocusSeconds: body.totalFocusSeconds,
      updatedAt: new Date(),
    })
    .where(and(eq(focusSessions.id, body.id), eq(focusSessions.orgId, orgId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(focusSessions).where(and(eq(focusSessions.id, id), eq(focusSessions.orgId, orgId)))
  return Response.json({ ok: true })
}
