import { getOrgAndUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { notes } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'
import { crudRatelimit, checkRatelimit } from '@/lib/ratelimit'

export async function GET() {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(notes).where(
    and(eq(notes.orgId, orgId), or(eq(notes.isDeleted, false), isNull(notes.isDeleted)))
  )
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
  const [row] = await db.insert(notes).values({
    orgId, userId,
    title: body.title,
    content: body.content ?? '',
    isPublic: body.isPublic ?? false,
    tags: body.tags ?? [],
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(notes)
    .set({
      title: body.title,
      content: body.content,
      isPublic: body.isPublic,
      tags: body.tags,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, body.id), eq(notes.orgId, orgId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.orgId, orgId)))
  return Response.json({ ok: true })
}
