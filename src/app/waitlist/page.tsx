'use client'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function WaitlistPage() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [slots, setSlots] = useState({ filled: 1, remaining: 99, total: 100 })

  useEffect(() => {
    fetch('/api/beta-count')
      .then(r => { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(d => setSlots({
        filled: typeof d.filled === 'number' ? d.filled : 1,
        remaining: typeof d.remaining === 'number' ? d.remaining : 99,
        total: typeof d.total === 'number' ? d.total : 100,
      }))
      .catch(() => {})
  }, [])

  if (!isLoaded) return null

  const name = user?.firstName || user?.username || 'there'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#e2e2f0', fontFamily: 'var(--font, system-ui)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* bg glow */}
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.08),transparent 65%)', pointerEvents: 'none' }} />

      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48, position: 'relative', zIndex: 1, cursor: 'pointer' }}
        onClick={() => router.push('/')} role="button">
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }} onClick={() => router.push('/')}>P</div>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => router.push('/')}>Pulsar</span>
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520 }}>
        {/* check circle */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: '2rem' }}>✅</div>

        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>// waitlist_confirmed</div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 16 }}>
          You're on the list,<br /><span style={{ color: '#a78bfa' }}>{name}.</span>
        </h1>
        <p style={{ color: '#9898b8', fontSize: '1rem', lineHeight: 1.65, marginBottom: 8 }}>
          We'll email you at <span style={{ color: '#e2e2f0', fontWeight: 600 }}>{email}</span> the moment beta opens.
        </p>
        <p style={{ color: '#666688', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 36 }}>
          Pulsar is in closed beta — only {slots.total} seats total. You're locked in.
        </p>

        {/* progress bar */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ width: 200, height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${(slots.filled / slots.total) * 100}%`, height: '100%', borderRadius: 5, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 600 }}>{slots.remaining} left</span>
          </div>
          <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#555570' }}>{slots.filled} of {slots.total} beta seats claimed</p>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={() => router.push('/')} style={{ padding: '12px 32px', borderRadius: 9, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', border: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(167,139,250,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(167,139,250,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.2)' }}>
              Go to Dashboard
            </button>
          )}
          <button onClick={() => router.push('/')} style={{ padding: '12px 32px', borderRadius: 9, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)' }}>
            ← Back to homepage
          </button>
          <button onClick={() => signOut(() => router.push('/'))} style={{ padding: '8px 20px', borderRadius: 9, background: 'transparent', border: 'none', color: '#555570', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9898b8' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555570' }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
