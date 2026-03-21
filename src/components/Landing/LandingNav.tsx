'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

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

  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleLink = (href: string) => {
    setMenuOpen(false)
    router.push(href)
  }

  return (
    <>
      <nav style={{
        position: isFixed ? 'fixed' : 'sticky',
        top: 0, left: 0, right: 0, zIndex: 100,
        padding: isFixed ? (scrolled ? '11px 40px' : '20px 40px') : '18px 40px',
        paddingLeft: isMobile ? 20 : undefined,
        paddingRight: isMobile ? 20 : undefined,
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

        {isMobile ? (
          /* Hamburger button */
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{ background: 'none', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center', transition: `all 0.2s ${E}` }}
          >
            <span style={{ display: 'block', width: 18, height: 1.5, background: menuOpen ? 'rgba(167,139,250,0.8)' : '#7878a0', borderRadius: 2, transform: menuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none', transition: `all 0.2s ${E}` }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: menuOpen ? 'transparent' : '#7878a0', borderRadius: 2, transition: `all 0.2s ${E}` }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: menuOpen ? 'rgba(167,139,250,0.8)' : '#7878a0', borderRadius: 2, transform: menuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none', transition: `all 0.2s ${E}` }} />
          </button>
        ) : (
          /* Desktop nav */
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
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
            {isAuthed ? (
              <button
                onClick={() => onGetStarted ? onGetStarted() : router.push('/')}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif", transition: `all 0.22s ${E}`, display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >Go to Dashboard →</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
          paddingTop: 64,
          background: 'rgba(7,7,12,0.97)',
          backdropFilter: 'blur(26px) saturate(1.6)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: 0,
          transform: menuOpen ? 'translateY(0)' : 'translateY(-110%)',
          transition: `transform 0.35s ${E}`,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}>
          {LINKS.map(([label, href]) => (
            <button key={label} onClick={() => handleLink(href)}
              style={{ background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px 24px', textAlign: 'left', color: pathname === href ? '#eeeef5' : '#7878a0', fontSize: '1rem', fontWeight: 500, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', letterSpacing: '0.01em' }}
            >{label}</button>
          ))}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isAuthed ? (
              <button onClick={() => { setMenuOpen(false); onGetStarted ? onGetStarted() : router.push('/') }}
                style={{ padding: '13px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}
              >Go to Dashboard →</button>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); router.push('/sign-in') }}
                  style={{ padding: '13px 20px', borderRadius: 8, border: '1px solid rgba(167,139,250,0.2)', background: 'transparent', color: '#a0a0b8', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}
                >Sign In</button>
                <button onClick={() => { setMenuOpen(false); onGetStarted ? onGetStarted() : router.push('/sign-up') }}
                  style={{ padding: '13px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}
                >Join Waitlist</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
