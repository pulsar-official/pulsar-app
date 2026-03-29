// Client-side only — never import this in server code
import { PowerSyncDatabase, WASQLiteOpenFactory } from '@powersync/web'
import { AppSchema } from './schema'

// Module-scope singleton — stable across React re-renders and Strict Mode double-mounts
const factory = new WASQLiteOpenFactory({
  dbFilename: 'pulsar.db',
  // Pre-bundled worker copied to public/ by postinstall script
  worker: '/@powersync/worker/WASQLiteDB.umd.js',
})

export const db = new PowerSyncDatabase({
  database: factory,
  schema: AppSchema,
  flags: { disableSSRWarning: true },
  sync: {
    worker: '/@powersync/worker/SharedSyncImplementation.umd.js',
  },
})
