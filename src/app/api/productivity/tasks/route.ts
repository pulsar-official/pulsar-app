import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks } from '@/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'

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
  const body = await req.json()
  if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })

  // PowerSync upsert: if clientId exists, update the record; otherwise insert
  if (body.clientId) {
    const existing = await db.select({ id: tasks.id }).from(tasks)
      .where(eq(tasks.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(tasks)
        .set({
          title: body.title, description: body.description ?? '',
          completed: body.completed ?? false, priority: body.priority ?? 'medium',
          tag: body.tag ?? 'work', status: body.status ?? 'todo',
          dueDate: body.dueDate ?? null, isPublic: body.isPublic ?? false,
          updatedAt: new Date(),
        })
        .where(eq(tasks.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(tasks).values({
      clientId: body.clientId, orgId, userId,
      title: body.title, description: body.description ?? '',
      completed: body.completed ?? false, priority: body.priority ?? 'medium',
      tag: body.tag ?? 'work', status: body.status ?? 'todo',
      dueDate: body.dueDate ?? null, isPublic: body.isPublic ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  const [row] = await db.insert(tasks).values({
    orgId, userId, title: body.title,
    description: body.description ?? '', completed: body.completed ?? false,
    priority: body.priority ?? 'medium', tag: body.tag ?? 'work',
    status: body.status ?? 'todo', dueDate: body.dueDate ?? null,
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
    ? and(eq(tasks.clientId, body.clientId), eq(tasks.orgId, orgId))
    : and(eq(tasks.id, body.id), eq(tasks.orgId, orgId))
  const [row] = await db.update(tasks)
    .set({
      title: body.title, description: body.description,
      completed: body.completed, priority: body.priority,
      tag: body.tag, status: body.status, dueDate: body.dueDate,
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
    ? and(eq(tasks.clientId, clientId), eq(tasks.orgId, orgId))
    : and(eq(tasks.id, id), eq(tasks.orgId, orgId))
  await db.delete(tasks).where(where!)
  return Response.json({ ok: true })
}
