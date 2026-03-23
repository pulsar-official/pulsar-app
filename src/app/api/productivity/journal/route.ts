import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { journalEntries } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const rows = await db.select().from(journalEntries).where(eq(journalEntries.orgId, oid))
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
  const [row] = await db.insert(journalEntries).values({
    orgId: oid, userId,
    title: body.title,
    content: body.content ?? '',
    date: body.date,
    mood: body.mood ?? null,
    tags: body.tags ?? [],
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
  const [row] = await db.update(journalEntries)
    .set({
      title: body.title,
      content: body.content,
      mood: body.mood,
      tags: body.tags,
      updatedAt: new Date(),
    })
    .where(and(eq(journalEntries.id, body.id), eq(journalEntries.orgId, oid)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const { id } = await req.json()
  await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.orgId, oid)))
  return Response.json({ ok: true })
}
