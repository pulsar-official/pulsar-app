import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { goals, goalSubs } from '@/db/schema'
import { eq, and, or, isNull, inArray } from 'drizzle-orm'
import { crudRatelimit, checkRatelimit } from '@/lib/ratelimit'

export async function GET() {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const goalRows = await db.select().from(goals).where(
    and(eq(goals.orgId, orgId), or(eq(goals.isDeleted, false), isNull(goals.isDeleted)))
  )
  const goalIds = goalRows.map(g => g.id)
  let subRows: typeof goalSubs.$inferSelect[] = []
  if (goalIds.length > 0) {
    subRows = await db.select().from(goalSubs).where(
      and(inArray(goalSubs.goalId, goalIds), or(eq(goalSubs.isDeleted, false), isNull(goalSubs.isDeleted)))
    )
  }
  const goalsWithSubs = goalRows.map(g => ({
    ...g,
    subs: subRows.filter(s => s.goalId === g.id),
  }))
  return Response.json(goalsWithSubs)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()

  // Add sub-goal — verify goal belongs to org
  if (body.action === 'addSub') {
    if (!body.goalId || !body.text?.trim()) return Response.json({ error: 'goalId and text required' }, { status: 400 })
    const [goal] = await db.select({ id: goals.id }).from(goals)
      .where(and(eq(goals.id, body.goalId), eq(goals.orgId, orgId)))
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 })
    const [row] = await db.insert(goalSubs).values({
      goalId: body.goalId,
      text: body.text,
      done: false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Toggle sub-goal — verify parent goal belongs to org
  if (body.action === 'toggleSub') {
    if (!body.subId) return Response.json({ error: 'subId required' }, { status: 400 })
    const [sub] = await db.select({ id: goalSubs.id, goalId: goalSubs.goalId }).from(goalSubs)
      .where(eq(goalSubs.id, body.subId))
    if (!sub) return Response.json({ error: 'Not found' }, { status: 404 })
    const [goal] = await db.select({ id: goals.id }).from(goals)
      .where(and(eq(goals.id, sub.goalId), eq(goals.orgId, orgId)))
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 })
    const [row] = await db.update(goalSubs)
      .set({ done: body.done })
      .where(eq(goalSubs.id, body.subId))
      .returning()
    return Response.json(row)
  }

  // Create goal
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
  const [row] = await db.insert(goals).values({
    orgId, userId,
    title: body.title,
    description: body.description ?? '',
    category: body.category ?? 'work',
    priority: body.priority ?? 'medium',
    deadline: body.deadline ?? null,
    done: body.done ?? false,
    progress: body.progress ?? 0,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(goals)
    .set({
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      deadline: body.deadline,
      done: body.done,
      progress: body.progress,
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, body.id), eq(goals.orgId, orgId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.orgId, orgId)))
  return Response.json({ ok: true })
}
