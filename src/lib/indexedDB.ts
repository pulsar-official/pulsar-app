/**
 * IndexedDB Wrapper
 * Handles all offline-first data storage
 * Provides 5-50MB of storage vs localStorage's 5MB
 */

const DB_NAME = 'pulsar-app'
const DB_VERSION = 1

interface DBSchema {
  state: 'readonly' | 'readwrite'
  store: 'appState' | 'syncQueue' | 'cache'
}

let db: IDBDatabase | null = null

/**
 * Initialize IndexedDB
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available in non-browser environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store for full app state (replicated from server)
      if (!database.objectStoreNames.contains('appState')) {
        database.createObjectStore('appState', { keyPath: 'id' })
      }

      // Store for queued offline actions
      if (!database.objectStoreNames.contains('syncQueue')) {
        const queueStore = database.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        })
        queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        queueStore.createIndex('synced', 'synced', { unique: false })
      }

      // Store for cached API responses
      if (!database.objectStoreNames.contains('cache')) {
        const cacheStore = database.createObjectStore('cache', { keyPath: 'key' })
        cacheStore.createIndex('expiry', 'expiry', { unique: false })
      }
    }
  })
}

/**
 * Get IDBDatabase instance (initialize if needed)
 */
async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    db = await initIndexedDB()
  }
  return db
}

/**
 * Save app state locally (called after fetching from server)
 */
export async function saveAppState(data: Record<string, any>) {
  try {
    const database = await getDB()
    const transaction = database.transaction(['appState'], 'readwrite')
    const store = transaction.objectStore('appState')

    // Clear old state
    store.clear()

    // Save new state
    Object.entries(data).forEach(([key, value]) => {
      store.add({ id: key, data: value })
    })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error saving app state:', error)
  }
}

/**
 * Get cached app state
 */
export async function getAppState(): Promise<Record<string, any> | null> {
  try {
    const database = await getDB()
    const transaction = database.transaction(['appState'], 'readonly')
    const store = transaction.objectStore('appState')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result: Record<string, any> = {}
        request.result.forEach((item: any) => {
          result[item.id] = item.data
        })
        resolve(Object.keys(result).length > 0 ? result : null)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting app state:', error)
    return null
  }
}

/**
 * Queue an action for offline sync
 */
export interface QueuedAction {
  id?: number
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  timestamp: number
  synced: boolean
  attempts: number
}

export async function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'synced' | 'attempts'>) {
  try {
    const database = await getDB()
    const transaction = database.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')

    const queuedAction: QueuedAction = {
      ...action,
      timestamp: Date.now(),
      synced: false,
      attempts: 0,
    }

    store.add(queuedAction)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(queuedAction)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error queueing action:', error)
  }
}

/**
 * Get all unsynced actions
 */
export async function getUnsyncedActions(): Promise<QueuedAction[]> {
  try {
    const database = await getDB()
    const transaction = database.transaction(['syncQueue'], 'readonly')
    const store = transaction.objectStore('syncQueue')
    const index = store.index('synced')
    const request = index.getAll(false as any)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result as QueuedAction[])
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting unsynced actions:', error)
    return []
  }
}

/**
 * Mark action as synced
 */
export async function markActionSynced(id: number) {
  try {
    const database = await getDB()
    const transaction = database.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    const request = store.get(id)

    request.onsuccess = () => {
      const action = request.result
      action.synced = true
      store.put(action)
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error marking action synced:', error)
  }
}

/**
 * Cache API response
 */
export async function cacheResponse(key: string, data: any, ttlSeconds = 3600) {
  try {
    const database = await getDB()
    const transaction = database.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')

    const cacheEntry = {
      key,
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    }

    store.put(cacheEntry)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error caching response:', error)
  }
}

/**
 * Get cached response
 */
export async function getCachedResponse(key: string): Promise<any | null> {
  try {
    const database = await getDB()
    const transaction = database.transaction(['cache'], 'readonly')
    const store = transaction.objectStore('cache')
    const request = store.get(key)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        if (result && result.expiry > Date.now()) {
          resolve(result.data)
        } else {
          // Expired
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting cached response:', error)
    return null
  }
}

/**
 * Clear all IndexedDB data
 */
export async function clearIndexedDB() {
  try {
    const database = await getDB()
    const stores = ['appState', 'syncQueue', 'cache']

    for (const storeName of stores) {
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      store.clear()

      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true)
        transaction.onerror = () => reject(transaction.error)
      })
    }
  } catch (error) {
    console.error('Error clearing IndexedDB:', error)
  }
}
