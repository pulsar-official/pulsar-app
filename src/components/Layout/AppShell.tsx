'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'

export default function AppShell() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  // Admin if publicMetadata.role === 'admin' (set in Clerk dashboard)
  const isAdmin = user?.publicMetadata?.role === 'admin'

  useEffect(() => {
    if (isLoaded && userId && !BETA_OPEN && !isAdmin) {
      router.push('/waitlist')
    }
  }, [isLoaded, userId, router, isAdmin])

  if (!isLoaded) return null

  // Beta open or admin → show dashboard
  if (userId && (BETA_OPEN || isAdmin)) return <AppLayout />

  // Signed in but beta not open → blank while redirect fires
  if (userId) return null

  // Not authenticated → landing page
  return (
    <PulsarLanding
      onEnter={() => router.push('/sign-up')}
    />
  )
}
