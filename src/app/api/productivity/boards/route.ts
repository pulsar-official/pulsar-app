import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { boards, boardNodes, boardThreads } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET() {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const boardRows = await db.select().from(boards).where(eq(boards.orgId, orgId))
  const boardIds = boardRows.map(b => b.id)
  let nodeRows: typeof boardNodes.$inferSelect[] = []
  let threadRows: typeof boardThreads.$inferSelect[] = []
  if (boardIds.length > 0) {
    nodeRows = await db.select().from(boardNodes).where(inArray(boardNodes.boardId, boardIds))
    threadRows = await db.select().from(boardThreads).where(inArray(boardThreads.boardId, boardIds))
  }
  const boardsWithData = boardRows.map(b => ({
    ...b,
    nodes: nodeRows.filter(n => n.boardId === b.id),
    threads: threadRows.filter(t => t.boardId === b.id),
  }))
  return Response.json(boardsWithData)
}

export async function POST(req: Request) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // Add node — verify board belongs to org
  if (body.action === 'addNode') {
    if (!body.boardId || !body.title?.trim()) return Response.json({ error: 'boardId and title required' }, { status: 400 })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, body.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
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

  // Add thread — verify board belongs to org
  if (body.action === 'addThread') {
    if (!body.boardId || !body.fromNodeId || !body.toNodeId) return Response.json({ error: 'boardId, fromNodeId, toNodeId required' }, { status: 400 })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, body.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    const [row] = await db.insert(boardThreads).values({
      boardId: body.boardId,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      label: body.label ?? '',
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Create board
  if (!body.name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
  const [row] = await db.insert(boards).values({
    orgId, userId,
    name: body.name,
    description: body.description ?? '',
    color: body.color ?? '',
    icon: body.icon ?? '',
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // Update node — verify node's board belongs to org
  if (body.action === 'updateNode') {
    if (!body.nodeId) return Response.json({ error: 'nodeId required' }, { status: 400 })
    const [node] = await db.select({ id: boardNodes.id, boardId: boardNodes.boardId }).from(boardNodes)
      .where(eq(boardNodes.id, body.nodeId))
    if (!node) return Response.json({ error: 'Not found' }, { status: 404 })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, node.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    const [row] = await db.update(boardNodes)
      .set({ title: body.title, body: body.body, x: body.x, y: body.y, status: body.status, priority: body.priority })
      .where(eq(boardNodes.id, body.nodeId))
      .returning()
    return Response.json(row)
  }

  // Update board
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  const [row] = await db.update(boards)
    .set({ name: body.name, description: body.description, color: body.color, icon: body.icon, updatedAt: new Date() })
    .where(and(eq(boards.id, body.id), eq(boards.orgId, orgId)))
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  if (body.action === 'deleteNode') {
    if (!body.nodeId) return Response.json({ error: 'nodeId required' }, { status: 400 })
    const [node] = await db.select({ id: boardNodes.id, boardId: boardNodes.boardId }).from(boardNodes)
      .where(eq(boardNodes.id, body.nodeId))
    if (!node) return Response.json({ error: 'Not found' }, { status: 404 })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, node.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    await db.delete(boardNodes).where(eq(boardNodes.id, body.nodeId))
    return Response.json({ ok: true })
  }

  if (body.action === 'deleteThread') {
    if (!body.threadId) return Response.json({ error: 'threadId required' }, { status: 400 })
    const [thread] = await db.select({ id: boardThreads.id, boardId: boardThreads.boardId }).from(boardThreads)
      .where(eq(boardThreads.id, body.threadId))
    if (!thread) return Response.json({ error: 'Not found' }, { status: 404 })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, thread.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    await db.delete(boardThreads).where(eq(boardThreads.id, body.threadId))
    return Response.json({ ok: true })
  }

  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  await db.delete(boards).where(and(eq(boards.id, body.id), eq(boards.orgId, orgId)))
  return Response.json({ ok: true })
}
