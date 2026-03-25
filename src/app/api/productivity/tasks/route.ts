import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'
import { crudRatelimit, checkRatelimit } from '@/lib/ratelimit'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(tasks).where(
    and(eq(tasks.orgId, orgId), or(eq(tasks.isDeleted, false), isNull(tasks.isDeleted)))
  )
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })
  const [row] = await db.insert(tasks).values({
    orgId, userId,
    title: body.title,
    description: body.description ?? '',
    completed: body.completed ?? false,
    priority: body.priority ?? 'medium',
    tag: body.tag ?? 'work',
    status: body.status ?? 'todo',
    dueDate: body.dueDate ?? null,
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
  const [row] = await db.update(tasks)
    .set({
      title: body.title,
      description: body.description,
      completed: body.completed,
      priority: body.priority,
      tag: body.tag,
      status: body.status,
      dueDate: body.dueDate,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, body.id), eq(tasks.orgId, orgId)))
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
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.orgId, orgId)))
  return Response.json({ ok: true })
}
