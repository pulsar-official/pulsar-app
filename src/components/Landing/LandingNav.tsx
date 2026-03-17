'use client'
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

  return (
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
          /* Already signed in — show Go to Dashboard */
          <button
            onClick={() => onGetStarted ? onGetStarted() : router.push('/')}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',system-ui,sans-serif", transition: `all 0.22s ${E}`, display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >Go to Dashboard →</button>
        ) : (
          /* Not signed in — show Sign In + Get Started */
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
            >Get Started</button>
          </div>
        )}
      </div>
    </nav>
  )
}
