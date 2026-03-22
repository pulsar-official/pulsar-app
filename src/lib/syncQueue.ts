/**
 * Sync Queue Manager
 * Handles offline action queuing and syncing when back online
 */

import { getUnsyncedActions, markActionSynced, queueAction as dbQueueAction, QueuedAction } from './indexedDB'

interface SyncQueueListener {
  onSync: (action: QueuedAction) => void
  onError: (action: QueuedAction, error: Error) => void
  onComplete: () => void
}

let isSyncing = false
let syncListeners: SyncQueueListener[] = []

/**
 * Check if online
 */
export function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine
}

/**
 * Queue an action for offline sync
 */
export async function queueOfflineAction(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any
) {
  return dbQueueAction({
    endpoint,
    method,
    body,
  })
}

/**
 * Sync queued actions with server
 */
export async function syncQueue() {
  if (isSyncing || !isOnline()) {
    return
  }

  isSyncing = true

  try {
    const actions = await getUnsyncedActions()

    for (const action of actions) {
      try {
        // Send request to server
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Mark as synced
        await markActionSynced(action.id!)

        // Notify listeners
        syncListeners.forEach((listener) => listener.onSync(action))
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        // Retry logic - increment attempts
        if (action.attempts < 3) {
          action.attempts++
          // Could implement exponential backoff here
        } else {
          // Max retries reached
          syncListeners.forEach((listener) => listener.onError(action, err))
        }
      }
    }

    // Notify sync complete
    syncListeners.forEach((listener) => listener.onComplete())
  } finally {
    isSyncing = false
  }
}

/**
 * Subscribe to sync events
 */
export function subscribeSyncQueue(listener: SyncQueueListener): () => void {
  syncListeners.push(listener)

  // Return unsubscribe function
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener)
  }
}

/**
 * Set up auto-sync when coming back online
 */
export function setupAutoSync() {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    console.log('[Sync] Back online, syncing queue...')
    syncQueue().catch(console.error)
  })

  window.addEventListener('offline', () => {
    console.log('[Sync] Going offline, actions will be queued')
  })

  // Try to sync on startup if online
  if (isOnline()) {
    // Delay slightly to let app initialize
    setTimeout(() => syncQueue().catch(console.error), 1000)
  }
}
