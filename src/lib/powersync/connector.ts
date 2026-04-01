import type { PowerSyncBackendConnector, AbstractPowerSyncDatabase } from '@powersync/web'

// ── Helpers ─────────────────────────────────────────────────────────────────

function toBool(val: unknown): boolean {
  return val === 1 || val === true
}

function parseJsonField(val: unknown): unknown {
  if (val == null || val === '') return null
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return val }
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

// Convert full row data (snake_case + int booleans) → camelCase JS object
function mapRow(data: Record<string, unknown>, boolFields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    const ck = snakeToCamel(k)
    out[ck] = boolFields.includes(k) ? toBool(v) : v
  }
  return out
}

// ── Table → route config ─────────────────────────────────────────────────────

const ROUTE_MAP: Record<string, string> = {
  tasks: '/api/productivity/tasks',
  habits: '/api/productivity/habits',
  habit_checks: '/api/productivity/habits',
  goals: '/api/productivity/goals',
  goal_subs: '/api/productivity/goals',
  journal_entries: '/api/productivity/journal',
  cal_events: '/api/productivity/events',
  boards: '/api/productivity/boards',
  board_nodes: '/api/productivity/boards',
  board_threads: '/api/productivity/boards',
  focus_sessions: '/api/productivity/focus-sessions',
  user_preferences: '/api/productivity/preferences',
}

// Boolean fields per table (stored as 0/1 integers in SQLite)
const BOOL_FIELDS: Record<string, string[]> = {
  tasks: ['completed', 'is_public', 'is_deleted'],
  habits: ['is_public', 'is_deleted'],
  habit_checks: ['checked', 'is_deleted'],
  goals: ['done', 'is_public', 'is_deleted'],
  goal_subs: ['done', 'is_deleted'],
  journal_entries: ['is_public', 'is_deleted'],
  cal_events: ['is_public', 'is_deleted'],
  boards: ['is_public', 'is_deleted'],
  board_nodes: ['is_deleted'],
  board_threads: ['is_deleted'],
  focus_sessions: ['is_public', 'is_deleted'],
  user_preferences: ['is_deleted'],
}

// JSON text fields that need to be parsed before sending to API
const JSON_FIELDS: Record<string, string[]> = {
  journal_entries: ['tags'],
  user_preferences: ['value'],
}

function buildBody(
  table: string,
  id: string,
  data: Record<string, unknown>,
  opType: 'PUT' | 'DELETE' | 'PATCH'
): Record<string, unknown> {
  const bools = BOOL_FIELDS[table] ?? []
  const jsonFields = JSON_FIELDS[table] ?? []
  const camel = mapRow(data, bools)

  // Parse JSON text fields
  for (const f of jsonFields) {
    const ck = snakeToCamel(f)
    if (ck in camel) camel[ck] = parseJsonField(camel[ck])
  }

  // child tables need special action routing
  if (table === 'habit_checks') {
    if (opType === 'PUT') {
      return {
        action: 'insertCheck',
        clientId: id,
        habitClientId: data.habit_id,
        date: data.date,
        checked: toBool(data.checked),
      }
    }
    return { action: 'deleteCheck', clientId: id }
  }

  if (table === 'goal_subs') {
    if (opType === 'PUT') {
      return {
        action: 'addSub',
        clientId: id,
        goalClientId: data.goal_id,
        text: data.text,
        done: toBool(data.done),
      }
    }
    return { action: 'deleteSub', clientId: id }
  }

  if (table === 'board_nodes') {
    if (opType === 'PUT') {
      return { action: 'addNode', clientId: id, ...camel }
    }
    return { action: 'deleteNode', clientId: id }
  }

  if (table === 'board_threads') {
    if (opType === 'PUT') {
      return { action: 'addThread', clientId: id, ...camel }
    }
    return { action: 'deleteThread', clientId: id }
  }

  // Parent tables: include clientId for upsert/delete lookups
  return { clientId: id, ...camel }
}

// ── Connector class ──────────────────────────────────────────────────────────

export class PulsarConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const res = await fetch('/api/powersync/auth')
    if (!res.ok) throw new Error('[PowerSync] Failed to fetch credentials')
    const data = await res.json()
    return {
      endpoint: data.powersync_url as string,
      token: data.token as string,
      expiresAt: new Date(data.expires_at as string),
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    try {
      for (const op of transaction.crud) {
        const url = ROUTE_MAP[op.table]
        if (!url) {
          console.warn('[PowerSync] Unknown table in uploadData:', op.table)
          continue
        }

        const data = (op.opData ?? {}) as Record<string, unknown>
        const body = buildBody(op.table, op.id, data, op.op as 'PUT' | 'DELETE' | 'PATCH')

        let method: string
        if (op.op === 'DELETE') {
          method = 'DELETE'
        } else {
          // PUT ops from PowerSync map to POST (upsert) on parent tables
          // Child tables (habit_checks, goal_subs, board_nodes, board_threads) always POST
          method = 'POST'
        }

        // Treat updates (PUT with existing record) differently from creates
        // We use a custom header so the API can distinguish create vs update
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (res.status === 401 || res.status === 403) {
          // Auth error — throw so the transaction is NOT completed and PowerSync retries later
          throw new Error(`[PowerSync] Auth error ${res.status} uploading ${op.table} ${op.op}`)
        }

        if (res.status >= 400 && res.status < 500) {
          // Bad data (400/409/422) — log and skip to avoid blocking the queue forever
          console.error(`[PowerSync] 4xx error for ${op.table} ${op.op}:`, await res.text())
          continue
        }

        if (!res.ok) {
          // 5xx / network error — throw to retry
          throw new Error(`[PowerSync] ${res.status} uploading ${op.table} ${op.op}`)
        }
      }

      await transaction.complete()
    } catch (err) {
      // Do NOT complete the transaction — PowerSync will retry on next sync cycle
      console.error('[PowerSync] uploadData error:', err)
      throw err
    }
  }
}
