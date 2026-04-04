'use client'
import { PowerSyncContext } from '@powersync/react'
import { Suspense, useEffect } from 'react'
import { db } from '@/lib/powersync/db'
import { PulsarConnector } from '@/lib/powersync/connector'

// Module-scope connector singleton — stable across re-renders
const connector = new PulsarConnector()

export function PulsarPowerSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect only on the client, after the user is authenticated
    db.connect(connector).catch(err => console.error('[PowerSync] connect error:', err))
    return () => {
      db.disconnect().catch(() => {})
    }
  }, [])

  return (
    <Suspense>
      <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
    </Suspense>
  )
}

export async function disconnectPowerSync() {
  await db.disconnectAndClear()
}
