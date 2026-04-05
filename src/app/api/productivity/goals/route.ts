import { getOrgAndUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { goals, goalSubs } from '@/db/schema'
import { eq, and, or, isNull, inArray } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await getOrgAndUser()
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
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // PowerSync: add sub-goal by clientId
  if (body.action === 'addSub') {
    if (!body.goalClientId && !body.goalId) return Response.json({ error: 'goalClientId required' }, { status: 400 })
    if (!body.text?.trim()) return Response.json({ error: 'text required' }, { status: 400 })

    let goalIntId: number | null = null
    if (body.goalClientId) {
      const [g] = await db.select({ id: goals.id }).from(goals).where(eq(goals.clientId, body.goalClientId))
      if (!g) return Response.json({ error: 'Goal not found' }, { status: 404 })
      goalIntId = g.id
    } else {
      goalIntId = body.goalId
    }

    const [goal] = await db.select({ id: goals.id }).from(goals)
      .where(and(eq(goals.id, goalIntId!), eq(goals.orgId, orgId)))
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 })

    // Upsert: skip if clientId already exists
    if (body.clientId) {
      const existing = await db.select({ id: goalSubs.id }).from(goalSubs)
        .where(eq(goalSubs.clientId, body.clientId))
      if (existing.length > 0) {
        await db.update(goalSubs).set({ text: body.text, done: body.done ?? false })
          .where(eq(goalSubs.clientId, body.clientId))
        return Response.json({ ok: true })
      }
    }

    const [row] = await db.insert(goalSubs).values({
      clientId: body.clientId ?? undefined,
      goalId: goalIntId!, text: body.text, done: body.done ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // PowerSync: delete sub-goal by clientId
  if (body.action === 'deleteSub') {
    if (!body.clientId) return Response.json({ error: 'clientId required' }, { status: 400 })
    await db.delete(goalSubs).where(eq(goalSubs.clientId, body.clientId))
    return Response.json({ ok: true })
  }

  // Toggle sub-goal (supports both integer id and clientId UUID)
  if (body.action === 'toggleSub') {
    if (!body.subId && !body.clientId) return Response.json({ error: 'subId or clientId required' }, { status: 400 })
    const lookupWhere = body.clientId ? eq(goalSubs.clientId, body.clientId) : eq(goalSubs.id, body.subId)
    const [sub] = await db.select({ id: goalSubs.id, goalId: goalSubs.goalId }).from(goalSubs).where(lookupWhere)
    if (!sub) return Response.json({ error: 'Not found' }, { status: 404 })
    const [goal] = await db.select({ id: goals.id }).from(goals)
      .where(and(eq(goals.id, sub.goalId), eq(goals.orgId, orgId)))
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 })
    const updateWhere = body.clientId ? eq(goalSubs.clientId, body.clientId) : eq(goalSubs.id, body.subId)
    const [row] = await db.update(goalSubs)
      .set({ done: body.done })
      .where(updateWhere)
      .returning()
    return Response.json(row)
  }

  // PowerSync upsert: create or update goal by clientId
  if (body.clientId) {
    if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
    const existing = await db.select({ id: goals.id }).from(goals)
      .where(eq(goals.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(goals)
        .set({
          title: body.title, description: body.description ?? '',
          category: body.category ?? 'work', priority: body.priority ?? 'medium',
          deadline: body.deadline ?? null, done: body.done ?? false,
          progress: body.progress ?? 0, isPublic: body.isPublic ?? false,
          updatedAt: new Date(),
        })
        .where(eq(goals.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(goals).values({
      clientId: body.clientId, orgId, userId,
      title: body.title, description: body.description ?? '',
      category: body.category ?? 'work', priority: body.priority ?? 'medium',
      deadline: body.deadline ?? null, done: body.done ?? false,
      progress: body.progress ?? 0, isPublic: body.isPublic ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Create goal
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
  const [row] = await db.insert(goals).values({
    orgId, userId, title: body.title,
    description: body.description ?? '', category: body.category ?? 'work',
    priority: body.priority ?? 'medium', deadline: body.deadline ?? null,
    done: body.done ?? false, progress: body.progress ?? 0,
    isPublic: body.isPublic ?? false,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id && !body.clientId) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = body.clientId
    ? and(eq(goals.clientId, body.clientId), eq(goals.orgId, orgId))
    : and(eq(goals.id, body.id), eq(goals.orgId, orgId))
  const [row] = await db.update(goals)
    .set({
      title: body.title, description: body.description,
      category: body.category, priority: body.priority,
      deadline: body.deadline, done: body.done, progress: body.progress,
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
    ? and(eq(goals.clientId, clientId), eq(goals.orgId, orgId))
    : and(eq(goals.id, id), eq(goals.orgId, orgId))
  const isDeleted = body.isDeleted !== false
  await db.update(goals).set({ isDeleted, updatedAt: new Date() }).where(where!)
  return Response.json({ ok: true })
}
