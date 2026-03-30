'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useSupabaseAuth'

interface Props {
  variant?: 'sticky' | 'fixed'
  scrolled?: boolean
  onGetStarted?: () => void
}

const E = 'cubic-bezier(0.22,1,0.36,1)'
const LINKS: [string, string][] = [
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['Changelog', '/changelog'],
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
        paddingTop: isFixed ? (scrolled ? 10 : 18) : 14,
        paddingBottom: isFixed ? (scrolled ? 10 : 18) : 14,
        paddingLeft: isMobile ? 20 : 40,
        paddingRight: isMobile ? 20 : 40,
        background: showGlass ? 'rgba(7,7,12,0.94)' : 'transparent',
        backdropFilter: showGlass ? 'blur(20px) saturate(1.4)' : 'none',
        borderBottom: '1px solid ' + (showGlass ? 'rgba(255,255,255,0.06)' : 'transparent'),
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: `all 0.35s ${E}`,
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: '#eeeef5' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#7c3aed', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.92rem', letterSpacing: '-0.01em', fontFamily: "'JetBrains Mono',monospace" }}>pulsar</span>
        </a>

        {isMobile ? (
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{ background: 'none', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 7, padding: '7px 9px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center', transition: `all 0.2s ${E}` }}
          >
            <span style={{ display: 'block', width: 16, height: 1.5, background: menuOpen ? '#a78bfa' : '#65657a', borderRadius: 2, transform: menuOpen ? 'rotate(45deg) translate(1.5px, 1.5px)' : 'none', transition: `all 0.2s ${E}` }} />
            <span style={{ display: 'block', width: 16, height: 1.5, background: menuOpen ? 'transparent' : '#65657a', borderRadius: 2, transition: `all 0.2s ${E}` }} />
            <span style={{ display: 'block', width: 16, height: 1.5, background: menuOpen ? '#a78bfa' : '#65657a', borderRadius: 2, transform: menuOpen ? 'rotate(-45deg) translate(1.5px, -1.5px)' : 'none', transition: `all 0.2s ${E}` }} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {LINKS.map(([label, href]) => {
              const active = pathname === href
              return (
                <a key={label} href={href} style={{ position: 'relative', color: active ? '#eeeef5' : '#65657a', fontSize: '0.8rem', fontWeight: 500, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.01em', transition: `color 0.2s ${E}`, textDecoration: 'none', paddingBottom: 2 }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#a0a0b8' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#65657a' }}
                >
                  {label}
                  {active && <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, borderRadius: 1, background: '#a78bfa' }} />}
                </a>
              )
            })}

            {isAuthed ? (
              <button
                onClick={() => onGetStarted ? onGetStarted() : router.push('/')}
                style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}` }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >dashboard →</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => router.push('/sign-in')}
                  style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#65657a', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; e.currentTarget.style.color = '#a0a0b8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#65657a' }}
                >sign in</button>
                <button
                  onClick={() => onGetStarted ? onGetStarted() : router.push('/sign-up')}
                  style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}` }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >join waitlist</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile dropdown */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
          paddingTop: 56,
          background: 'rgba(7,7,12,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          transform: menuOpen ? 'translateY(0)' : 'translateY(-110%)',
          transition: `transform 0.32s ${E}`,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}>
          {LINKS.map(([label, href]) => (
            <button key={label} onClick={() => handleLink(href)}
              style={{ background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '16px 24px', textAlign: 'left', color: pathname === href ? '#eeeef5' : '#65657a', fontSize: '0.9rem', fontWeight: 500, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              {pathname === href && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />}
              {label}
            </button>
          ))}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isAuthed ? (
              <button onClick={() => { setMenuOpen(false); onGetStarted ? onGetStarted() : router.push('/') }}
                style={{ padding: '12px 20px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}
              >dashboard →</button>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); router.push('/sign-in') }}
                  style={{ padding: '12px 20px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#a0a0b8', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}
                >sign in</button>
                <button onClick={() => { setMenuOpen(false); onGetStarted ? onGetStarted() : router.push('/sign-up') }}
                  style={{ padding: '12px 20px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}
                >join waitlist</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
