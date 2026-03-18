'use client'
import { Waitlist } from '@clerk/nextjs'
import { useEffect } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ps-auth *{margin:0;padding:0;box-sizing:border-box}
.ps-auth{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd2:rgba(255,255,255,0.08);--bd3:rgba(255,255,255,0.14);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ft:'Space Grotesk',system-ui,sans-serif;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;overflow:hidden}
@keyframes psOrbit1{from{transform:rotate(0) translateX(180px) rotate(0)}to{transform:rotate(360deg) translateX(180px) rotate(-360deg)}}
@keyframes psOrbit2{from{transform:rotate(0) translateX(260px) rotate(0)}to{transform:rotate(360deg) translateX(260px) rotate(-360deg)}}
@keyframes psFadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.ps-auth ::-webkit-scrollbar{width:4px}.ps-auth ::-webkit-scrollbar-track{background:transparent}.ps-auth ::-webkit-scrollbar-thumb{background:rgba(167,139,250,.15);border-radius:3px}
`

export default function SignUpPage() {
  useEffect(() => {
    if (!document.getElementById('ps-auth-css')) {
      const s = document.createElement('style')
      s.id = 'ps-auth-css'
      s.textContent = CSS
      document.head.appendChild(s)
    }
  }, [])

  const appearance = {
    variables: {
      colorPrimary: '#a78bfa',
      colorBackground: 'rgba(12,12,20,0)',
      colorText: '#eeeef5',
      colorTextSecondary: '#a0a0b8',
      colorInputBackground: '#18182a',
      colorInputText: '#eeeef5',
      colorInputPlaceholder: '#45455a',
      borderRadius: '10px',
      fontFamily: "'Space Grotesk',system-ui,sans-serif",
      fontSize: '15px',
    },
    elements: {
      rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
      card: {
        background: 'rgba(12,12,20,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        padding: '36px 32px',
        animation: 'psFadeIn 0.6s cubic-bezier(0.16,1,0.3,1)',
      },
      headerTitle: { color: '#eeeef5', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em' },
      headerSubtitle: { color: '#a0a0b8', fontSize: '0.92rem' },
      formFieldInput: {
        background: '#18182a',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#eeeef5',
        borderRadius: '8px',
        fontSize: '0.95rem',
      },
      formButtonPrimary: {
        background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
        borderRadius: '10px',
        fontSize: '0.98rem',
        fontWeight: 600,
        boxShadow: '0 4px 16px rgba(167,139,250,0.15)',
      },
      footerActionLink: { color: '#a78bfa' },
      dividerLine: { background: 'rgba(255,255,255,0.08)' },
      dividerText: { color: '#45455a' },
    },
  }

  const E = 'cubic-bezier(0.16,1,0.3,1)'
  const orbitals = [
    { size: 360, border: 'rgba(167,139,250,0.04)', dot: '#a78bfa', dotSize: 6, anim: 'psOrbit1', dur: '24s' },
    { size: 520, border: 'rgba(167,139,250,0.025)', dot: '#e879f9', dotSize: 4, anim: 'psOrbit2', dur: '36s' },
  ]

  return (
    <div className="ps-auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
      {/* Orbitals */}
      <div style={{ position: 'absolute', top: '45%', left: '25%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
        {orbitals.map((o, i) => (
          <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: o.size, height: o.size, borderRadius: '50%', border: `1px solid ${o.border}` }}>
            <div style={{ position: 'absolute', top: -o.dotSize / 2, left: '50%', width: o.dotSize, height: o.dotSize, borderRadius: '50%', background: o.dot, opacity: 0.4, animation: `${o.anim} ${o.dur} linear infinite` }} />
          </div>
        ))}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.06),transparent 60%)' }} />
      </div>
      {/* Waitlist component */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, animation: `psFadeIn 0.6s ${E}` }}>
        <Waitlist afterJoinWaitlistUrl="/waitlist" appearance={appearance} />
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: '#65657a' }}>
          Already approved?{' '}
          <a href="/sign-in" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
