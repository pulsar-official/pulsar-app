'use client'
import { PowerSyncContext } from '@powersync/react'
import { Suspense } from 'react'
import { db } from '@/lib/powersync/db'
import { PulsarConnector } from '@/lib/powersync/connector'

// Module-scope singleton — stable across React re-renders and Strict Mode double-mounts
const connector = new PulsarConnector()
db.connect(connector) // fire-and-forget

export function PulsarPowerSyncProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
    </Suspense>
  )
}

export async function disconnectPowerSync() {
  await db.disconnectAndClear()
}
