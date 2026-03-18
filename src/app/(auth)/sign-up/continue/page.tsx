'use client'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Clerk redirects here when OAuth sign-up has extra steps (org creation etc.)
// We just complete whatever's pending and push to /waitlist.
export default function SignUpContinuePage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    const finish = async () => {
      try {
        if (!signUp) { router.replace('/sign-up'); return }

        if (signUp.status === 'complete') {
          if (signUp.createdSessionId) await setActive!({ session: signUp.createdSessionId })
          router.replace('/waitlist')
          return
        }

        // If missing requirements, try to update with empty payload —
        // Clerk will auto-fill what it can (e.g. org from email domain)
        const updated = await signUp.update({})
        if (updated.status === 'complete') {
          if (updated.createdSessionId) await setActive!({ session: updated.createdSessionId })
          router.replace('/waitlist')
        } else {
          // Still not complete — send back to sign-up
          router.replace('/sign-up')
        }
      } catch {
        router.replace('/sign-up')
      }
    }

    finish()
  }, [isLoaded, signUp, setActive, router])

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1s ease infinite' }} />
    </div>
  )
}
