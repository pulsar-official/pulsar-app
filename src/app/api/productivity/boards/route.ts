import { getOrgAndUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { boards, boardNodes, boardThreads } from '@/db/schema'
import { eq, and, or, isNull, inArray } from 'drizzle-orm'
import { crudRatelimit, checkRatelimit } from '@/lib/ratelimit'

export async function GET() {
  const { orgId } = await getOrgAndUser()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const boardRows = await db.select().from(boards).where(
    and(eq(boards.orgId, orgId), or(eq(boards.isDeleted, false), isNull(boards.isDeleted)))
  )
  const boardIds = boardRows.map(b => b.id)
  let nodeRows: typeof boardNodes.$inferSelect[] = []
  let threadRows: typeof boardThreads.$inferSelect[] = []
  if (boardIds.length > 0) {
    nodeRows = await db.select().from(boardNodes).where(
      and(inArray(boardNodes.boardId, boardIds), or(eq(boardNodes.isDeleted, false), isNull(boardNodes.isDeleted)))
    )
    threadRows = await db.select().from(boardThreads).where(
      and(inArray(boardThreads.boardId, boardIds), or(eq(boardThreads.isDeleted, false), isNull(boardThreads.isDeleted)))
    )
  }
  const boardsWithData = boardRows.map(b => ({
    ...b,
    nodes: nodeRows.filter(n => n.boardId === b.id),
    threads: threadRows.filter(t => t.boardId === b.id),
  }))
  return Response.json(boardsWithData)
}

export async function POST(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()

  // Add node — resolve boardClientId or boardId to integer boardId
  if (body.action === 'addNode') {
    if ((!body.boardId && !body.boardClientId) || !body.title?.trim()) {
      return Response.json({ error: 'boardId/boardClientId and title required' }, { status: 400 })
    }
    let boardIntId: number | null = null
    if (body.boardClientId) {
      const [b] = await db.select({ id: boards.id }).from(boards).where(eq(boards.clientId, body.boardClientId))
      if (!b) return Response.json({ error: 'Board not found' }, { status: 404 })
      boardIntId = b.id
    } else {
      boardIntId = body.boardId
    }
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, boardIntId!), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })

    // Upsert by clientId
    if (body.clientId) {
      const existing = await db.select({ id: boardNodes.id }).from(boardNodes)
        .where(eq(boardNodes.clientId, body.clientId))
      if (existing.length > 0) {
        const [row] = await db.update(boardNodes)
          .set({ title: body.title, body: body.body ?? '', x: body.x ?? 0, y: body.y ?? 0, status: body.status ?? 'todo', priority: body.priority ?? 'medium' })
          .where(eq(boardNodes.clientId, body.clientId))
          .returning()
        return Response.json(row)
      }
    }
    const [row] = await db.insert(boardNodes).values({
      clientId: body.clientId ?? undefined,
      boardId: boardIntId!,
      type: body.type ?? 'task', title: body.title,
      body: body.body ?? '', x: body.x ?? 0, y: body.y ?? 0,
      status: body.status ?? 'todo', priority: body.priority ?? 'medium',
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Add thread — resolve client UUIDs to integer IDs
  if (body.action === 'addThread') {
    const boardClientId = body.boardClientId || body.boardId
    const fromClientId = body.fromNodeClientId || body.fromNodeId
    const toClientId = body.toNodeClientId || body.toNodeId
    if (!boardClientId || !fromClientId || !toClientId) {
      return Response.json({ error: 'boardId, fromNodeId, toNodeId required' }, { status: 400 })
    }

    // Resolve board integer id
    let boardIntId: number | null = null
    if (typeof boardClientId === 'string' && boardClientId.includes('-')) {
      const [b] = await db.select({ id: boards.id }).from(boards).where(eq(boards.clientId, boardClientId))
      if (!b) return Response.json({ error: 'Board not found' }, { status: 404 })
      boardIntId = b.id
    } else {
      boardIntId = boardClientId
    }

    // Resolve node integer ids
    let fromIntId: number | null = null
    let toIntId: number | null = null
    if (typeof fromClientId === 'string' && fromClientId.includes('-')) {
      const [n] = await db.select({ id: boardNodes.id }).from(boardNodes).where(eq(boardNodes.clientId, fromClientId))
      if (!n) return Response.json({ error: 'From node not found' }, { status: 404 })
      fromIntId = n.id
    } else { fromIntId = fromClientId }
    if (typeof toClientId === 'string' && toClientId.includes('-')) {
      const [n] = await db.select({ id: boardNodes.id }).from(boardNodes).where(eq(boardNodes.clientId, toClientId))
      if (!n) return Response.json({ error: 'To node not found' }, { status: 404 })
      toIntId = n.id
    } else { toIntId = toClientId }

    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, boardIntId!), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })

    if (body.clientId) {
      const existing = await db.select({ id: boardThreads.id }).from(boardThreads)
        .where(eq(boardThreads.clientId, body.clientId))
      if (existing.length > 0) {
        const [row] = await db.update(boardThreads)
          .set({ label: body.label ?? '' })
          .where(eq(boardThreads.clientId, body.clientId))
          .returning()
        return Response.json(row)
      }
    }
    const [row] = await db.insert(boardThreads).values({
      clientId: body.clientId ?? undefined,
      boardId: boardIntId!, fromNodeId: fromIntId!,
      toNodeId: toIntId!, label: body.label ?? '',
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // PowerSync upsert: create or update board by clientId
  if (body.clientId) {
    if (!body.name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
    const existing = await db.select({ id: boards.id }).from(boards)
      .where(eq(boards.clientId, body.clientId))
    if (existing.length > 0) {
      const [row] = await db.update(boards)
        .set({ name: body.name, description: body.description ?? '', color: body.color ?? '', icon: body.icon ?? '', isPublic: body.isPublic ?? false, updatedAt: new Date() })
        .where(eq(boards.clientId, body.clientId))
        .returning()
      return Response.json(row)
    }
    const [row] = await db.insert(boards).values({
      clientId: body.clientId, orgId, userId,
      name: body.name, description: body.description ?? '',
      color: body.color ?? '', icon: body.icon ?? '',
      isPublic: body.isPublic ?? false,
    }).returning()
    return Response.json(row, { status: 201 })
  }

  // Create board
  if (!body.name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
  const [row] = await db.insert(boards).values({
    orgId, userId, name: body.name,
    description: body.description ?? '', color: body.color ?? '',
    icon: body.icon ?? '', isPublic: body.isPublic ?? false,
  }).returning()
  return Response.json(row, { status: 201 })
}

export async function PUT(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()

  if (body.action === 'updateNode') {
    if (!body.nodeId && !body.clientId) return Response.json({ error: 'nodeId required' }, { status: 400 })
    const nodeWhere = body.clientId ? eq(boardNodes.clientId, body.clientId) : eq(boardNodes.id, body.nodeId)
    const [node] = await db.select({ id: boardNodes.id, boardId: boardNodes.boardId }).from(boardNodes).where(nodeWhere)
    if (!node) return Response.json({ error: 'Not found' }, { status: 404 })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, node.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    const [row] = await db.update(boardNodes)
      .set({ title: body.title, body: body.body, x: body.x, y: body.y, status: body.status, priority: body.priority })
      .where(eq(boardNodes.id, node.id))
      .returning()
    return Response.json(row)
  }

  if (!body.id && !body.clientId) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = body.clientId
    ? and(eq(boards.clientId, body.clientId), eq(boards.orgId, orgId))
    : and(eq(boards.id, body.id), eq(boards.orgId, orgId))
  const [row] = await db.update(boards)
    .set({ name: body.name, description: body.description, color: body.color, icon: body.icon, isPublic: body.isPublic, updatedAt: new Date() })
    .where(where!)
    .returning()
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(req: Request) {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await checkRatelimit(crudRatelimit, userId)
  if (limited) return limited
  const body = await req.json()

  if (body.action === 'deleteNode') {
    const nodeWhere = body.clientId ? eq(boardNodes.clientId, body.clientId) : body.nodeId ? eq(boardNodes.id, body.nodeId) : null
    if (!nodeWhere) return Response.json({ error: 'nodeId or clientId required' }, { status: 400 })
    const [node] = await db.select({ id: boardNodes.id, boardId: boardNodes.boardId }).from(boardNodes).where(nodeWhere)
    if (!node) return Response.json({ ok: true })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, node.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    await db.delete(boardNodes).where(eq(boardNodes.id, node.id))
    return Response.json({ ok: true })
  }

  if (body.action === 'deleteThread') {
    const threadWhere = body.clientId ? eq(boardThreads.clientId, body.clientId) : body.threadId ? eq(boardThreads.id, body.threadId) : null
    if (!threadWhere) return Response.json({ error: 'threadId or clientId required' }, { status: 400 })
    const [thread] = await db.select({ id: boardThreads.id, boardId: boardThreads.boardId }).from(boardThreads).where(threadWhere)
    if (!thread) return Response.json({ ok: true })
    const [board] = await db.select({ id: boards.id }).from(boards)
      .where(and(eq(boards.id, thread.boardId), eq(boards.orgId, orgId)))
    if (!board) return Response.json({ error: 'Not found' }, { status: 404 })
    await db.delete(boardThreads).where(eq(boardThreads.id, thread.id))
    return Response.json({ ok: true })
  }

  const clientId = body.clientId
  const id = body.id
  if (!clientId && !id) return Response.json({ error: 'id or clientId required' }, { status: 400 })
  const where = clientId
    ? and(eq(boards.clientId, clientId), eq(boards.orgId, orgId))
    : and(eq(boards.id, id), eq(boards.orgId, orgId))
  await db.delete(boards).where(where!)
  return Response.json({ ok: true })
}
