'use client'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'

export default function AppShell() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  // Show nothing while Clerk hydrates (avoids flash)
  if (!isLoaded) return null

  // Authenticated → straight to dashboard
  if (userId) return <AppLayout />

  // Not authenticated → landing page
  return (
    <PulsarLanding
      onEnter={() => router.push('/sign-up')}
    />
  )
}
