'use client'

import { PowerSyncContext } from '@powersync/react'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { getPowerSyncDb } from '@/lib/powersync/database'
import { PulsarConnector } from '@/lib/powersync/connector'
import type { PowerSyncDatabase } from '@powersync/web'

export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth()
  const [db, setDb] = useState<PowerSyncDatabase | null>(null)

  useEffect(() => {
    if (!userId) return

    const database = getPowerSyncDb()
    const connector = new PulsarConnector()

    database.connect(connector).then(() => {
      setDb(database)
    })

    return () => {
      database.disconnect()
      setDb(null)
    }
  }, [userId])

  // Render children immediately so the app isn't blank while PowerSync connects.
  // usePowerSyncBridge already guards on null db, so nothing throws.
  if (!db) return <>{children}</>

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  )
}
