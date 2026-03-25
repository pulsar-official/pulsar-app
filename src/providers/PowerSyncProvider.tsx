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

  if (!db) return null

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  )
}
