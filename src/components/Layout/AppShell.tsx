'use client'
import { useAuth, useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'
import { useProductivityStore } from '@/stores/productivityStore'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useOfflineSync } from '@/hooks/useOfflineSync'

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'

export default function AppShell() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()
  const fetchAll = useProductivityStore(s => s.fetchAll)
  const storeOrgId = useProductivityStore(s => s.orgId)

  const isAdmin = user?.publicMetadata?.role === 'admin'
  const orgId = organization?.id ?? null
  // Use orgId if in an org, otherwise fall back to userId for personal accounts
  const effectiveOrgId = orgId ?? userId ?? null

  // Initialize service worker and offline support
  useServiceWorker()
  useOfflineSync()

  // Fetch productivity data when org/user changes
  useEffect(() => {
    if (effectiveOrgId && effectiveOrgId !== storeOrgId) {
      fetchAll(effectiveOrgId)
    }
  }, [effectiveOrgId, storeOrgId, fetchAll])

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
