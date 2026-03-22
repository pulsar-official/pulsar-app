import { useEffect, useState, useCallback } from 'react'
import { isOnline, syncQueue, subscribeSyncQueue, setupAutoSync } from '@/lib/syncQueue'
import { getUnsyncedActions } from '@/lib/indexedDB'

/**
 * Hook for managing offline sync in components
 * Provides sync status and manual sync trigger
 */
export function useOfflineSync() {
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Check initial online status
  useEffect(() => {
    setOnline(isOnline())

    // Setup auto-sync when online
    setupAutoSync()

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[OfflineSync] App back online')
      setOnline(true)
      // Auto-sync when back online
      manualSync()
    }

    const handleOffline = () => {
      console.log('[OfflineSync] App went offline')
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get initial unsynced count
    updateUnsyncedCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = subscribeSyncQueue({
      onSync: (action) => {
        console.log('[OfflineSync] Synced action:', action)
        updateUnsyncedCount()
      },
      onError: (action, error) => {
        console.error('[OfflineSync] Sync error:', action, error)
      },
      onComplete: () => {
        console.log('[OfflineSync] Sync complete')
        setSyncing(false)
        setLastSyncTime(new Date())
        updateUnsyncedCount()
      },
    })

    return unsubscribe
  }, [])

  const updateUnsyncedCount = useCallback(async () => {
    const actions = await getUnsyncedActions()
    setUnsyncedCount(actions.length)
  }, [])

  const manualSync = useCallback(async () => {
    if (syncing || !online) return

    setSyncing(true)
    try {
      await syncQueue()
    } catch (error) {
      console.error('[OfflineSync] Manual sync error:', error)
    } finally {
      setSyncing(false)
    }
  }, [syncing, online])

  return {
    online,
    syncing,
    unsyncedCount,
    lastSyncTime,
    sync: manualSync,
  }
}

/**
 * Hook for queuing an action when offline
 */
export function useOfflineAction() {
  const { online } = useOfflineSync()

  const executeWithOfflineSupport = useCallback(
    async (
      action: () => Promise<any>,
      offlineAction?: () => Promise<any>
    ): Promise<any> => {
      if (online) {
        try {
          return await action()
        } catch (error) {
          console.error('Action error:', error)
          throw error
        }
      } else {
        // Offline - use fallback if provided
        if (offlineAction) {
          return await offlineAction()
        }
        throw new Error('App is offline and no offline action provided')
      }
    },
    [online]
  )

  return {
    executeWithOfflineSupport,
    online,
  }
}
