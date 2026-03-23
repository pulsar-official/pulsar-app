import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const rows = await db.select().from(tasks).where(eq(tasks.orgId, oid))
  return Response.json(rows)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
  const [row] = await db.insert(tasks).values({
    orgId: oid, userId,
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
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
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
    .where(and(eq(tasks.id, body.id), eq(tasks.orgId, oid)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const { id } = await req.json()
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.orgId, oid)))
  return Response.json({ ok: true })
}
