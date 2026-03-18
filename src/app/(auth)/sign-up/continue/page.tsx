'use client'
import { useSignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignUpContinuePage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isLoaded: authLoaded, userId } = useAuth()
  const router = useRouter()
  const [needUsername, setNeedUsername] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoaded || !isLoaded) return

    // Already signed in (OAuth completed as sign-in, not sign-up)
    if (userId) { router.replace('/waitlist'); return }

    const finish = async () => {
      try {
        if (!signUp) { router.replace('/sign-up'); return }

        if (signUp.status === 'complete') {
          if (signUp.createdSessionId) await setActive!({ session: signUp.createdSessionId })
          router.replace('/waitlist')
          return
        }

        // Check what fields are missing before trying to update
        const missing: string[] = (signUp as unknown as { missingFields?: string[] }).missingFields ?? []

        if (missing.includes('username')) {
          setNeedUsername(true)
          return
        }

        // Nothing obviously missing — try to auto-complete
        const updated = await signUp.update({})
        if (updated.status === 'complete') {
          if (updated.createdSessionId) await setActive!({ session: updated.createdSessionId })
          router.replace('/waitlist')
        } else {
          const stillMissing: string[] = (updated as unknown as { missingFields?: string[] }).missingFields ?? []
          if (stillMissing.includes('username')) {
            setNeedUsername(true)
          } else {
            router.replace('/sign-up')
          }
        }
      } catch {
        router.replace('/sign-up')
      }
    }

    finish()
  }, [isLoaded, authLoaded, userId, signUp, setActive, router])

  const submitUsername = async () => {
    if (!signUp || !username.trim()) return
    setLoading(true); setError('')
    try {
      const updated = await signUp.update({ username: username.trim() })
      if (updated.status === 'complete') {
        if (updated.createdSessionId) await setActive!({ session: updated.createdSessionId })
        router.replace('/waitlist')
      } else {
        router.replace('/sign-up')
      }
    } catch (err: unknown) {
      setError((err as { errors?: { longMessage?: string }[] })?.errors?.[0]?.longMessage ?? 'Something went wrong')
    } finally { setLoading(false) }
  }

  if (needUsername) {
    return (
      <div style={{ minHeight: '100vh', background: '#07070c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <div style={{ width: 380, padding: '32px 28px', background: 'rgba(12,12,20,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#eeeef5', backdropFilter: 'blur(24px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>P</div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Pulsar</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>One last thing</h2>
          <p style={{ fontSize: '0.9rem', color: '#a0a0b8', marginBottom: 24, lineHeight: 1.5 }}>Pick a username to finish creating your account.</p>
          <input
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            placeholder="e.g. cooldev"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') submitUsername() }}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 8, background: '#18182a', border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.08)'}`, color: '#eeeef5', fontSize: '0.95rem', outline: 'none', marginBottom: error ? 8 : 16, transition: 'border-color 0.2s' }}
            onFocus={e => { if (!error) e.currentTarget.style.borderColor = '#a78bfa' }}
            onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          {error && <p style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: 12 }}>{error}</p>}
          <button
            onClick={submitUsername}
            disabled={loading || !username.trim()}
            style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: loading || !username.trim() ? '#222236' : 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s' }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1s ease infinite' }} />
    </div>
  )
}
