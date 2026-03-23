import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { boards, boardNodes, boardThreads } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const boardRows = await db.select().from(boards).where(eq(boards.orgId, oid))
  const boardIds = boardRows.map(b => b.id)
  const boardIdSet = new Set(boardIds)
  let nodeRows: typeof boardNodes.$inferSelect[] = []
  let threadRows: typeof boardThreads.$inferSelect[] = []
  if (boardIds.length > 0) {
    nodeRows = await db.select().from(boardNodes)
    threadRows = await db.select().from(boardThreads)
  }
  const boardsWithData = boardRows.map(b => ({
    ...b,
    nodes: nodeRows.filter(n => boardIdSet.has(n.boardId) && n.boardId === b.id),
    threads: threadRows.filter(t => boardIdSet.has(t.boardId) && t.boardId === b.id),
  }))
  return Response.json(boardsWithData)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()

  // Add node
  if (body.action === 'addNode') {
    const [row] = await db.insert(boardNodes).values({
      boardId: body.boardId,
      type: body.type ?? 'task',
      title: body.title,
      body: body.body ?? '',
      x: body.x ?? 0,
      y: body.y ?? 0,
      status: body.status ?? 'todo',
      priority: body.priority ?? 'medium',
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Add thread
  if (body.action === 'addThread') {
    const [row] = await db.insert(boardThreads).values({
      boardId: body.boardId,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      label: body.label ?? '',
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Create board
  const [row] = await db.insert(boards).values({
    orgId: oid, userId,
    name: body.name,
    description: body.description ?? '',
    color: body.color ?? '',
    icon: body.icon ?? '',
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()

  // Update node
  if (body.action === 'updateNode') {
    const [row] = await db.update(boardNodes)
      .set({ title: body.title, body: body.body, x: body.x, y: body.y, status: body.status, priority: body.priority })
      .where(eq(boardNodes.id, body.nodeId))
      .returning()
    return Response.json(row)
  }

  // Update board
  const [row] = await db.update(boards)
    .set({ name: body.name, description: body.description, color: body.color, icon: body.icon, updatedAt: new Date() })
    .where(and(eq(boards.id, body.id), eq(boards.orgId, oid)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const oid = orgId ?? userId
  const body = await req.json()
  if (body.action === 'deleteNode') {
    await db.delete(boardNodes).where(eq(boardNodes.id, body.nodeId))
    return Response.json({ ok: true })
  }
  if (body.action === 'deleteThread') {
    await db.delete(boardThreads).where(eq(boardThreads.id, body.threadId))
    return Response.json({ ok: true })
  }
  await db.delete(boards).where(and(eq(boards.id, body.id), eq(boards.orgId, oid)))
  return Response.json({ ok: true })
}
