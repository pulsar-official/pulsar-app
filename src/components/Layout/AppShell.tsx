'use client'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'

export default function AppShell() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId && !BETA_OPEN) {
      router.push('/waitlist')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) return null

  // Beta is open → show dashboard
  if (userId && BETA_OPEN) return <AppLayout />

  // Signed in but beta not open → blank while redirect fires
  if (userId) return null

  // Not authenticated → landing page
  return (
    <PulsarLanding
      onEnter={() => router.push('/sign-up')}
    />
  )
}
