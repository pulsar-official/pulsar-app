import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { goals, goalSubs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const goalRows = await db.select().from(goals).where(eq(goals.orgId, orgId))
  const goalIds = goalRows.map(g => g.id)
  let subRows: typeof goalSubs.$inferSelect[] = []
  if (goalIds.length > 0) {
    subRows = await db.select().from(goalSubs)
  }
  const goalIdSet = new Set(goalIds)
  const goalsWithSubs = goalRows.map(g => ({
    ...g,
    subs: subRows.filter(s => goalIdSet.has(s.goalId) && s.goalId === g.id),
  }))
  return Response.json(goalsWithSubs)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // Add sub-goal
  if (body.action === 'addSub') {
    const [row] = await db.insert(goalSubs).values({
      goalId: body.goalId,
      text: body.text,
      done: false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Toggle sub-goal
  if (body.action === 'toggleSub') {
    const [row] = await db.update(goalSubs)
      .set({ done: body.done })
      .where(eq(goalSubs.id, body.subId))
      .returning()
    return Response.json(row)
  }

  // Create goal
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
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
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
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.orgId, orgId)))
  return Response.json({ ok: true })
}
