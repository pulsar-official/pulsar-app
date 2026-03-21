'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

interface Props {
  variant?: 'sticky' | 'fixed'
  scrolled?: boolean
  onGetStarted?: () => void
}

const E = 'cubic-bezier(0.16,1,0.3,1)'
const LINKS: [string, string][] = [
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['Community', '/#community'],
]

export default function LandingNav({ variant = 'sticky', scrolled = false, onGetStarted }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const isFixed = variant === 'fixed'
  const showGlass = !isFixed || scrolled
  const isAuthed = isLoaded && !!userId
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav style={{
        position: isFixed ? 'fixed' : 'sticky',
        top: 0, left: 0, right: 0, zIndex: 100,
        padding: isFixed ? (scrolled ? '11px 40px' : '20px 40px') : '18px 40px',
        background: showGlass ? 'rgba(7,7,12,0.92)' : 'transparent',
        backdropFilter: showGlass ? 'blur(26px) saturate(1.6)' : 'none',
        borderBottom: '1px solid ' + (showGlass ? 'rgba(255,255,255,0.08)' : 'transparent'),
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: `all 0.4s ${E}`,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#eeeef5' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 0 20px rgba(167,139,250,0.32)' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>Pulsar</span>
        </a>

        {/* Desktop links */}
        <div className="pl-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {LINKS.map(([label, href]) => {
            const active = pathname === href
            return (
              <a key={label} href={href}
                style={{ color: active ? '#eeeef5' : '#65657a', fontSize: '0.85rem', fontWeight: 500, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.01em', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.color = active ? '#eeeef5' : '#65657a' }}
              >{label}</a>
            )
          })}
        </div>

        {/* Desktop actions */}
        <div className="pl-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthed ? (
            <button
              onClick={() => onGetStarted ? onGetStarted() : router.push('/')}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif", transition: `all 0.22s ${E}`, display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >Go to Dashboard →</button>
          ) : (
            <>
              <button
                onClick={() => router.push('/sign-in')}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(167,139,250,0.2)', background: 'transparent', color: '#a0a0b8', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif", transition: `all 0.22s ${E}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; e.currentTarget.style.color = '#a0a0b8' }}
              >Sign In</button>
              <button
                onClick={() => onGetStarted ? onGetStarted() : router.push('/sign-up')}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif", transition: `all 0.22s ${E}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >Join Waitlist</button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="pl-nav-mobile-toggle"
          onClick={() => setMobileOpen(o => !o)}
          style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', background: 'none', color: '#eeeef5', cursor: 'pointer', borderRadius: 6 }}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="pl-mobile-only" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
          background: 'rgba(7,7,12,0.96)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          {LINKS.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMobileOpen(false)}
              style={{ color: '#eeeef5', fontSize: '1.2rem', fontWeight: 600, fontFamily: "'Space Grotesk',system-ui,sans-serif", textDecoration: 'none' }}
            >{label}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, width: '80%', maxWidth: 300 }}>
            {isAuthed ? (
              <button onClick={() => { setMobileOpen(false); onGetStarted ? onGetStarted() : router.push('/'); }}
                style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}
              >Go to Dashboard →</button>
            ) : (
              <>
                <button onClick={() => { setMobileOpen(false); router.push('/sign-in'); }}
                  style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(167,139,250,0.3)', background: 'transparent', color: '#a0a0b8', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}
                >Sign In</button>
                <button onClick={() => { setMobileOpen(false); onGetStarted ? onGetStarted() : router.push('/sign-up'); }}
                  style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}
                >Join Waitlist</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
