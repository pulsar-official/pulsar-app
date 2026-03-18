'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'

export default function AppShell() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const isAdmin = user?.publicMetadata?.role === 'admin'

  if (!isLoaded) return null

  // Beta open or admin → show dashboard
  if (userId && (BETA_OPEN || isAdmin)) return <AppLayout />

  // Signed-in waitlisted user or unauthenticated → show landing page
  // (redirect to /waitlist happens in sign-up/sign-in flows, not here)
  return (
    <PulsarLanding
      onEnter={() => router.push(userId ? '/waitlist' : '/sign-up')}
    />
  )
}
