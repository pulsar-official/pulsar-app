'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { SyncManager, type RemoteChange } from '@/lib/sync/syncManager'
import { getDeviceId } from '@/lib/sync/syncStorage'
import { useProductivityStore } from '@/stores/productivityStore'
import type { SyncConnectionStatus, SyncPresence } from '@/lib/sync/types'

/**
 * Hook that initializes and manages the SyncManager.
 * Replaces useOfflineSync.
 */
export function useSync() {
  const [status, setStatus] = useState<SyncConnectionStatus>('disconnected')
  const [presences, setPresences] = useState<SyncPresence[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const managerRef = useRef<SyncManager | null>(null)
  const orgId = useProductivityStore(s => s.orgId)
  const applyRemoteChange = useProductivityStore(s => s.applyRemoteChange)

  useEffect(() => {
    if (!orgId) return

    let manager: SyncManager | null = null

    const init = async () => {
      const deviceId = await getDeviceId()
      // userId comes from the store context; for the hook we use '' as placeholder
      // since auth is handled at the API layer
      manager = new SyncManager(orgId, '', deviceId, {
        onStatusChange: setStatus,
        onPresenceChange: setPresences,
        onRemoteChange: (change: RemoteChange) => {
          applyRemoteChange(change)
        },
        onSyncComplete: () => {
          updatePendingCount()
        },
        onError: (err) => {
          console.error('[useSync] Sync error:', err)
        },
      })

      managerRef.current = manager
      manager.start()
    }

    init()

    return () => {
      manager?.stop()
      managerRef.current = null
    }
  }, [orgId, applyRemoteChange])

  const updatePendingCount = useCallback(async () => {
    const { getPendingOps } = await import('@/lib/sync/syncStorage')
    const ops = await getPendingOps()
    setPendingCount(ops.length)
  }, [])

  const getManager = useCallback((): SyncManager | null => {
    return managerRef.current
  }, [])

  return {
    status,
    presences,
    pendingCount,
    isOnline: status === 'connected',
    getManager,
  }
}
