import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { habits, habitChecks } from '@/db/schema'
import { eq, and, or, isNull, inArray } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await auth()
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
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // Toggle a habit check — use transaction to prevent race condition
  if (body.action === 'toggle') {
    if (!body.habitId || !body.date) return Response.json({ error: 'habitId and date required' }, { status: 400 })
    // Verify habit belongs to org
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
          habitId: body.habitId,
          date: body.date,
          checked: true,
        }).returning()
        return { checked: true, id: row.id }
      }
    })
    return Response.json(result)
  }

  // Create a new habit
  if (!body.name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
  const [row] = await db.insert(habits).values({
    orgId, userId,
    name: body.name,
    emoji: body.emoji ?? '✅',
    sortOrder: body.sortOrder ?? 0,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function DELETE(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.orgId, orgId)))
  return Response.json({ ok: true })
}
