import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { journalEntries } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(journalEntries).where(
    and(eq(journalEntries.orgId, orgId), or(eq(journalEntries.isDeleted, false), isNull(journalEntries.isDeleted)))
  )
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
  if (!body.date) return Response.json({ error: 'date required' }, { status: 400 })

  // PowerSync upsert
  if (body.clientId) {
    const existing = await db.select({ id: journalEntries.id }).from(journalEntries)
      .where(eq(journalEntries.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(journalEntries)
        .set({
          title: body.title, content: body.content ?? '',
          mood: body.mood ?? null, tags: body.tags ?? [],
          isPublic: body.isPublic ?? false, updatedAt: new Date(),
        })
        .where(eq(journalEntries.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(journalEntries).values({
      clientId: body.clientId, orgId, userId,
      title: body.title, content: body.content ?? '',
      date: body.date, mood: body.mood ?? null,
      tags: body.tags ?? [], isPublic: body.isPublic ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  const [row] = await db.insert(journalEntries).values({
    orgId, userId, title: body.title,
    content: body.content ?? '', date: body.date,
    mood: body.mood ?? null, tags: body.tags ?? [],
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
    ? and(eq(journalEntries.clientId, body.clientId), eq(journalEntries.orgId, orgId))
    : and(eq(journalEntries.id, body.id), eq(journalEntries.orgId, orgId))
  const [row] = await db.update(journalEntries)
    .set({
      title: body.title, content: body.content,
      mood: body.mood, tags: body.tags,
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
    ? and(eq(journalEntries.clientId, clientId), eq(journalEntries.orgId, orgId))
    : and(eq(journalEntries.id, id), eq(journalEntries.orgId, orgId))
  await db.delete(journalEntries).where(where!)
  return Response.json({ ok: true })
}
