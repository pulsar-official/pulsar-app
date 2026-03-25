'use client'

import { PowerSyncDatabase } from '@powersync/web'
import { AppSchema } from './schema'

let db: PowerSyncDatabase | null = null

export function getPowerSyncDb(): PowerSyncDatabase {
  if (db) return db

  db = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'pulsar.db', // persisted in OPFS
    },
    // Disable SharedWorker — Vercel + Turbopack can't reliably resolve the
    // worker script URL at runtime. SQLite runs in the main thread instead.
    flags: {
      useWebWorker: false,
      disableSSRWarning: true,
    },
  })

  return db
}
