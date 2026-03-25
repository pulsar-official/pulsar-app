import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
} from '@powersync/web'

export interface PowerSyncCredentials {
  endpoint: string
  token: string
}

// Map PowerSync table names → API route paths
const ROUTE_MAP: Record<string, string> = {
  tasks:            '/api/productivity/tasks',
  habits:           '/api/productivity/habits',
  habit_checks:     '/api/productivity/habits',
  goals:            '/api/productivity/goals',
  goal_subs:        '/api/productivity/goals',
  journal_entries:  '/api/productivity/journal',
  cal_events:       '/api/productivity/events',
  boards:           '/api/productivity/boards',
  board_nodes:      '/api/productivity/boards',
  board_threads:    '/api/productivity/boards',
  notes:            '/api/productivity/notes',
  focus_sessions:   '/api/productivity/focus-sessions',
  user_preferences: '/api/productivity/preferences',
}

// Columns stored as JSON TEXT in SQLite that need parsing before upload
const JSON_COLUMNS: Record<string, string[]> = {
  journal_entries:  ['tags'],
  notes:            ['tags'],
  user_preferences: ['value'],
}

export class PulsarConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const res = await fetch('/api/powersync/auth')
    if (!res.ok) throw new Error('[PowerSync] Failed to fetch credentials')
    return res.json() as Promise<PowerSyncCredentials>
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    try {
      for (const op of transaction.crud) {
        await this.uploadOp(op)
      }
      await transaction.complete()
    } catch (error) {
      console.error('[PowerSync] uploadData failed:', error)
      throw error // re-throw so PowerSync retries
    }
  }

  private async uploadOp(op: CrudEntry): Promise<void> {
    const { table, op: opType, id, opData } = op
    const route = ROUTE_MAP[table]
    if (!route) throw new Error(`[PowerSync] No route mapped for table: ${table}`)

    const data = this.deserialize(table, opData ?? {})

    switch (opType) {
      case 'PUT': // create
        await fetch(route, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        })
        break

      case 'PATCH': // update
        await fetch(route, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        })
        break

      case 'DELETE':
        await fetch(route, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        break
    }
  }

  /** Parse JSON TEXT columns back to objects before sending to the API */
  private deserialize(
    table: string,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...data }
    for (const col of JSON_COLUMNS[table] ?? []) {
      if (typeof result[col] === 'string') {
        try {
          result[col] = JSON.parse(result[col] as string)
        } catch {
          // leave as string if parse fails
        }
      }
    }
    return result
  }
}
