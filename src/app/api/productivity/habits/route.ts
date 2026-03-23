import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { habits, habitChecks } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const habitRows = await db.select().from(habits).where(eq(habits.orgId, oid))
  const habitIds = habitRows.map(h => h.id)
  let checkRows: typeof habitChecks.$inferSelect[] = []
  if (habitIds.length > 0) {
    checkRows = await db.select().from(habitChecks)
  }
  // Filter checks to only those belonging to this org's habits
  const orgHabitIds = new Set(habitIds)
  const filteredChecks = checkRows.filter(c => orgHabitIds.has(c.habitId))
  return Response.json({ habits: habitRows, checks: filteredChecks })
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()

  // Toggle a habit check
  if (body.action === 'toggle') {
    const existing = await db.select().from(habitChecks)
      .where(and(eq(habitChecks.habitId, body.habitId), eq(habitChecks.date, body.date)))
    if (existing.length > 0) {
      await db.delete(habitChecks).where(eq(habitChecks.id, existing[0].id))
      return Response.json({ checked: false })
    } else {
      const [row] = await db.insert(habitChecks).values({
        habitId: body.habitId,
        date: body.date,
        checked: true,
      }).returning()
      return Response.json({ checked: true, id: row.id })
    }
  }

  // Create a new habit
  const [row] = await db.insert(habits).values({
    orgId: oid, userId,
    name: body.name,
    emoji: body.emoji ?? '✅',
    sortOrder: body.sortOrder ?? 0,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const { id } = await req.json()
  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.orgId, oid)))
  return Response.json({ ok: true })
}
