/**
 * Sync Storage — IndexedDB v2
 *
 * New database (pulsar-sync) to avoid migration complexity with the old one.
 * Stores: pending ops, sync cursors, and device identity.
 */

import type { PendingOp, SyncCursor } from './types'

const DB_NAME = 'pulsar-sync'
const DB_VERSION = 2

let db: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available on server'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Pending sync operations
      if (!database.objectStoreNames.contains('pendingOps')) {
        const store = database.createObjectStore('pendingOps', { keyPath: 'opId' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Sync cursors (last serverSeq per org)
      if (!database.objectStoreNames.contains('cursors')) {
        database.createObjectStore('cursors', { keyPath: 'orgId' })
      }

      // Device identity
      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'key' })
      }

      // App state cache for offline cold-start (v2)
      if (!database.objectStoreNames.contains('appStateCache')) {
        database.createObjectStore('appStateCache', { keyPath: 'orgId' })
      }
    }
  })
}

/* ── Pending Ops ── */

export async function addPendingOp(op: PendingOp): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('pendingOps', 'readwrite')
  tx.objectStore('pendingOps').put(op)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingOps(): Promise<PendingOp[]> {
  const database = await getDB()
  const tx = database.transaction('pendingOps', 'readonly')
  const store = tx.objectStore('pendingOps')
  const idx = store.index('status')
  const request = idx.getAll('pending')

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as PendingOp[])
    request.onerror = () => reject(request.error)
  })
}

export async function markOpSynced(opId: string): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('pendingOps', 'readwrite')
  const store = tx.objectStore('pendingOps')
  const request = store.get(opId)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      if (request.result) {
        request.result.status = 'synced'
        store.put(request.result)
      }
      tx.oncomplete = () => resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function markOpFailed(opId: string): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('pendingOps', 'readwrite')
  const store = tx.objectStore('pendingOps')
  const request = store.get(opId)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      if (request.result) {
        request.result.status = 'failed'
        request.result.attempts++
        store.put(request.result)
      }
      tx.oncomplete = () => resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function incrementOpAttempts(opId: string): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('pendingOps', 'readwrite')
  const store = tx.objectStore('pendingOps')
  const request = store.get(opId)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      if (request.result) {
        request.result.attempts++
        store.put(request.result)
      }
      tx.oncomplete = () => resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearSyncedOps(): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('pendingOps', 'readwrite')
  const store = tx.objectStore('pendingOps')
  const idx = store.index('status')
  const request = idx.openCursor('synced')

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        store.delete(cursor.primaryKey)
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ── Cursors ── */

export async function getCursor(orgId: string): Promise<number> {
  const database = await getDB()
  const tx = database.transaction('cursors', 'readonly')
  const request = tx.objectStore('cursors').get(orgId)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.lastSeq ?? 0)
    request.onerror = () => reject(request.error)
  })
}

export async function setCursor(orgId: string, lastSeq: number): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('cursors', 'readwrite')
  tx.objectStore('cursors').put({ orgId, lastSeq })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ── Device Identity ── */

/* ── App State Cache (offline cold-start) ── */

export interface AppStateSnapshot {
  orgId: string
  tasks: unknown[]
  habits: unknown[]
  habitChecks: unknown[]
  goals: unknown[]
  journalEntries: unknown[]
  events: unknown[]
  boards: unknown[]
  focusSessions: unknown[]
  preferences: unknown[]
  cachedAt: number
}

export async function saveAppStateCache(snapshot: AppStateSnapshot): Promise<void> {
  try {
    const database = await getDB()
    const tx = database.transaction('appStateCache', 'readwrite')
    tx.objectStore('appStateCache').put({ ...snapshot, cachedAt: Date.now() })
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Non-critical — cache is best-effort
    console.warn('[SyncStorage] Failed to save app state cache')
  }
}

export async function getAppStateCache(orgId: string): Promise<AppStateSnapshot | null> {
  try {
    const database = await getDB()
    const tx = database.transaction('appStateCache', 'readonly')
    const request = tx.objectStore('appStateCache').get(orgId)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

/* ── Device Identity ── */

export async function getDeviceId(): Promise<string> {
  const database = await getDB()
  const tx = database.transaction('meta', 'readonly')
  const request = tx.objectStore('meta').get('deviceId')

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      if (request.result?.value) {
        resolve(request.result.value)
      } else {
        // Generate and persist a new device ID
        const deviceId = `dev_${crypto.randomUUID()}`
        const writeTx = database.transaction('meta', 'readwrite')
        writeTx.objectStore('meta').put({ key: 'deviceId', value: deviceId })
        writeTx.oncomplete = () => resolve(deviceId)
        writeTx.onerror = () => reject(writeTx.error)
      }
    }
    request.onerror = () => reject(request.error)
  })
}
