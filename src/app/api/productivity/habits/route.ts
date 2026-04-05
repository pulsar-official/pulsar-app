import { getOrgAndUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { habits, habitChecks } from '@/db/schema'
import { eq, and, or, isNull, inArray } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const habitRows = await db.select().from(habits).where(
    and(eq(habits.orgId, orgId), or(eq(habits.isDeleted, false), isNull(habits.isDeleted)))
  )
  const habitIds = habitRows.map(h => h.id)
  let checkRows: typeof habitChecks.$inferSelect[] = []
  if (habitIds.length > 0) {
    checkRows = await db.select().from(habitChecks).where(
      and(inArray(habitChecks.habitId, habitIds), or(eq(habitChecks.isDeleted, false), isNull(habitChecks.isDeleted)))
    )
  }
  return Response.json({ habits: habitRows, checks: checkRows })
}

export async function POST(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // PowerSync: insert a discrete habit check
  if (body.action === 'insertCheck') {
    if (!body.habitClientId && !body.habitId) return Response.json({ error: 'habitClientId required' }, { status: 400 })
    if (!body.date) return Response.json({ error: 'date required' }, { status: 400 })

    let habitIntId: number | null = null
    if (body.habitClientId) {
      const [h] = await db.select({ id: habits.id }).from(habits).where(eq(habits.clientId, body.habitClientId))
      if (!h) return Response.json({ error: 'Habit not found' }, { status: 404 })
      habitIntId = h.id
    } else {
      habitIntId = body.habitId
    }

    // Verify habit belongs to org
    const [habit] = await db.select({ id: habits.id }).from(habits)
      .where(and(eq(habits.id, habitIntId!), eq(habits.orgId, orgId)))
    if (!habit) return Response.json({ error: 'Not found' }, { status: 404 })

    // Upsert: if clientId exists, skip duplicate insert
    if (body.clientId) {
      const existing = await db.select({ id: habitChecks.id }).from(habitChecks)
        .where(eq(habitChecks.clientId, body.clientId))
      if (existing.length > 0) return Response.json({ ok: true })
    }

    const [row] = await db.insert(habitChecks).values({
      clientId: body.clientId ?? undefined,
      habitId: habitIntId!,
      date: body.date,
      checked: body.checked ?? true,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // PowerSync: delete a discrete habit check by clientId
  if (body.action === 'deleteCheck') {
    if (!body.clientId) return Response.json({ error: 'clientId required' }, { status: 400 })
    const [check] = await db.select({ id: habitChecks.id, habitId: habitChecks.habitId }).from(habitChecks)
      .where(eq(habitChecks.clientId, body.clientId))
    if (!check) return Response.json({ ok: true }) // already deleted
    // Verify habit belongs to org
    await db.select({ id: habits.id }).from(habits)
      .where(and(eq(habits.id, check.habitId), eq(habits.orgId, orgId)))
    await db.delete(habitChecks).where(eq(habitChecks.clientId, body.clientId))
    return Response.json({ ok: true })
  }

  // Legacy toggle (kept for backward compatibility)
  if (body.action === 'toggle') {
    if (!body.habitId || !body.date) return Response.json({ error: 'habitId and date required' }, { status: 400 })
    const [habit] = await db.select({ id: habits.id }).from(habits)
      .where(and(eq(habits.id, body.habitId), eq(habits.orgId, orgId)))
    if (!habit) return Response.json({ error: 'Not found' }, { status: 404 })
    const result = await db.transaction(async (tx) => {
      const existing = await tx.select().from(habitChecks)
        .where(and(eq(habitChecks.habitId, body.habitId), eq(habitChecks.date, body.date)))
      if (existing.length > 0) {
        await tx.delete(habitChecks).where(eq(habitChecks.id, existing[0].id))
        return { checked: false }
      } else {
        const [row] = await tx.insert(habitChecks).values({
          habitId: body.habitId, date: body.date, checked: true,
        }).returning()
        return { checked: true, id: row.id }
      }
    })
    return Response.json(result)
  }

  // PowerSync upsert: create or update habit by clientId
  if (body.clientId) {
    if (!body.name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
    const existing = await db.select({ id: habits.id }).from(habits)
      .where(eq(habits.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(habits)
        .set({
          name: body.name, emoji: body.emoji ?? '✅',
          sortOrder: body.sortOrder ?? 0, isPublic: body.isPublic ?? false,
          category: body.category ?? 'health', archived: body.archived ?? false,
          frequency: body.frequency ?? 'daily',
        })
        .where(eq(habits.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(habits).values({
      clientId: body.clientId, orgId, userId,
      name: body.name, emoji: body.emoji ?? '✅',
      sortOrder: body.sortOrder ?? 0, isPublic: body.isPublic ?? false,
      category: body.category ?? 'health', archived: body.archived ?? false,
      frequency: body.frequency ?? 'daily',
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Create a new habit
  if (!body.name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
  const [row] = await db.insert(habits).values({
    orgId, userId, name: body.name,
    emoji: body.emoji ?? '✅', sortOrder: body.sortOrder ?? 0,
    isPublic: body.isPublic ?? false,
    category: body.category ?? 'health', archived: body.archived ?? false,
    frequency: body.frequency ?? 'daily',
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function DELETE(req: Request) {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const clientId = body.clientId
  const id = body.id
  if (!clientId && !id) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = clientId
    ? and(eq(habits.clientId, clientId), eq(habits.orgId, orgId))
    : and(eq(habits.id, id), eq(habits.orgId, orgId))
  const isDeleted = body.isDeleted !== false
  await db.update(habits).set({ isDeleted }).where(where!)
  return Response.json({ ok: true })
}
