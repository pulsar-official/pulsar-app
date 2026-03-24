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
  const [row] = await db.insert(journalEntries).values({
    orgId, userId,
    title: body.title,
    content: body.content ?? '',
    date: body.date,
    mood: body.mood ?? null,
    tags: body.tags ?? [],
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(journalEntries)
    .set({
      title: body.title,
      content: body.content,
      mood: body.mood,
      tags: body.tags,
      updatedAt: new Date(),
    })
    .where(and(eq(journalEntries.id, body.id), eq(journalEntries.orgId, orgId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.orgId, orgId)))
  return Response.json({ ok: true })
}
