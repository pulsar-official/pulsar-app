'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'
import { useProductivityStore } from '@/stores/productivityStore'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useSync } from '@/hooks/useSync'
import { PowerSyncProvider } from '@/providers/PowerSyncProvider'
import { usePowerSyncBridge } from '@/hooks/usePowerSyncBridge'

/** Thin gate — must live inside <PowerSyncProvider> so usePowerSyncBridge can access the db context */
function PowerSyncBridgeGate() {
  usePowerSyncBridge()
  return null
}

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'
const USE_POWERSYNC = process.env.NEXT_PUBLIC_USE_POWERSYNC === 'true'

export default function AppShell() {
  // useAuth gives orgId directly from the session token — more reliable than
  // useOrganization().organization?.id which can lag or be null until Clerk
  // resolves the active org.
  const { isLoaded, userId, orgId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const fetchAll = useProductivityStore(s => s.fetchAll)
  const storeOrgId = useProductivityStore(s => s.orgId)

  const isAdmin = user?.publicMetadata?.role === 'admin'

  // Initialize service worker
  useServiceWorker()

  // Only use the legacy sync system when PowerSync is not active
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (!USE_POWERSYNC) useSync()

  // Fetch productivity data when org changes (legacy path only)
  useEffect(() => {
    if (!USE_POWERSYNC && orgId && orgId !== storeOrgId) {
      fetchAll(orgId)
    }
  }, [orgId, storeOrgId, fetchAll])

  if (!isLoaded) return null

  // Beta open or admin → show dashboard
  if (userId && (BETA_OPEN || isAdmin)) {
    if (USE_POWERSYNC) {
      return (
        <PowerSyncProvider>
          <PowerSyncBridgeGate />
          <AppLayout />
        </PowerSyncProvider>
      )
    }
    return <AppLayout />
  }

  // Signed-in waitlisted user or unauthenticated → show landing page
  return (
    <PulsarLanding
      onEnter={() => router.push(userId ? '/waitlist' : '/sign-up')}
    />
  )
}
