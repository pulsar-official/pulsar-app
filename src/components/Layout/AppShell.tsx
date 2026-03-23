'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'
import { useProductivityStore } from '@/stores/productivityStore'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useOfflineSync } from '@/hooks/useOfflineSync'

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'

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

  // Initialize service worker and offline support
  useServiceWorker()
  useOfflineSync()

  // Fetch productivity data when org changes
  useEffect(() => {
    if (orgId && orgId !== storeOrgId) {
      fetchAll(orgId)
    }
  }, [orgId, storeOrgId, fetchAll])

  if (!isLoaded) return null

  // Beta open or admin → show dashboard
  if (userId && (BETA_OPEN || isAdmin)) return <AppLayout />

  // Signed-in waitlisted user or unauthenticated → show landing page
  return (
    <PulsarLanding
      onEnter={() => router.push(userId ? '/waitlist' : '/sign-up')}
    />
  )
}
