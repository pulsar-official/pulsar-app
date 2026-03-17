'use client'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'

export default function AppShell() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [enterDash, setEnterDash] = useState(false)

  if (!isLoaded) return null

  if (userId || enterDash) return <AppLayout />

  return (
    <PulsarLanding
      onEnter={() => {
        if (userId) setEnterDash(true)
        else router.push('/sign-up')
      }}
    />
  )
}
