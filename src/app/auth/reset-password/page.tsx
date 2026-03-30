'use client'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ps-reset *{margin:0;padding:0;box-sizing:border-box}
.ps-reset{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd2:rgba(255,255,255,0.08);--bd3:rgba(255,255,255,0.14);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--err:#f87171;--ft:'Space Grotesk',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;overflow:hidden}
@keyframes prFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes prGridPulse{0%,100%{opacity:0.015}50%{opacity:0.035}}
@keyframes prShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes prStrengthGrow{from{width:0}to{width:var(--sw)}}
.ps-reset ::-webkit-scrollbar{width:4px}.ps-reset ::-webkit-scrollbar-track{background:transparent}.ps-reset ::-webkit-scrollbar-thumb{background:rgba(167,139,250,.15);border-radius:3px}
`

function strengthScore(p: string): { score: number; label: string; color: string } {
  let s = 0
  if (p.length >= 8)  s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  if (s <= 1) return { score: s, label: 'Weak',   color: '#f87171' }
  if (s <= 3) return { score: s, label: 'Fair',   color: '#fbbf24' }
  if (s <= 4) return { score: s, label: 'Good',   color: '#6ee7b7' }
  return          { score: s, label: 'Strong', color: '#a78bfa' }
}

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    if (!document.getElementById('ps-reset-css')) {
      const s = document.createElement('style'); s.id = 'ps-reset-css'; s.textContent = CSS; document.head.appendChild(s)
    }
    // Verify we have an active recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
      else router.replace('/sign-in')
    })
  }, [supabase.auth, router])

  const str = strengthScore(pass)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!pass) e.pass = 'New password is required'
    else if (pass.length < 8) e.pass = 'At least 8 characters'
    if (!confirm) e.confirm = 'Please confirm your password'
    else if (pass !== confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const submit = async () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length) { setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pass })
      if (error) {
        setErrors({ pass: error.message }); setShake(true); setTimeout(() => setShake(false), 500)
      } else {
        setDone(true)
        setTimeout(() => router.push('/sign-in'), 2400)
      }
    } finally { setLoading(false) }
  }

  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', borderRadius: 8, background: 'var(--s3)',
    border: `1px solid ${errors[field] ? 'var(--err)' : 'var(--bd2)'}`,
    color: 'var(--t1)', fontSize: '0.95rem', fontFamily: 'var(--ft)', outline: 'none',
    transition: `all 0.2s ${E}`,
  })
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600,
    color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 7,
  }

  if (!sessionReady) return null

  return (
    <div className="ps-reset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(167,139,250,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%,black 0%,transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%,black 0%,transparent 70%)', animation: 'prGridPulse 8s ease infinite' }} />
      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.06),transparent 55%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: 400, padding: '36px 32px', background: 'rgba(12,12,20,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--bd2)', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: `prFadeIn 0.6s ${E}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#7c3aed', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>Pulsar</span>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>✅</div>
            <p style={{ color: 'var(--ok)', fontWeight: 600, marginBottom: 8, fontSize: '1rem' }}>Password updated!</p>
            <p style={{ color: 'var(--t2)', fontSize: '0.88rem', lineHeight: 1.5 }}>Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>Set new password</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--t2)', marginBottom: 28, lineHeight: 1.5 }}>Choose a strong password for your account.</p>

            <div style={{ animation: shake ? 'prShake 0.4s ease' : 'none' }}>
              {/* New password */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={e => { setPass(e.target.value); setErrors(er => { const n = { ...er }; delete n.pass; return n }) }}
                    placeholder="At least 8 characters"
                    style={{ ...inputStyle('pass'), paddingRight: 44 }}
                    onFocus={e => { if (!errors.pass) e.currentTarget.style.borderColor = 'var(--ac)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.08)' }}
                    onBlur={e => { if (!errors.pass) e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.boxShadow = 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter') submit() }}
                    autoFocus
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: '0.8rem', padding: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--t2)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--t4)' }}
                  >{showPass ? '●' : '○'}</button>
                </div>
                {errors.pass && <span style={{ fontSize: '0.72rem', color: 'var(--err)', fontFamily: 'var(--mn)', marginTop: 4, display: 'block' }}>{errors.pass}</span>}
                {/* Strength bar */}
                {pass.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(str.score / 5) * 100}%`, background: str.color, borderRadius: 2, transition: `width 0.3s ${E}, background 0.3s ${E}` }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: str.color, fontFamily: 'var(--mn)', fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{str.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setErrors(er => { const n = { ...er }; delete n.confirm; return n }) }}
                    placeholder="Repeat your password"
                    style={{ ...inputStyle('confirm'), paddingRight: 44 }}
                    onFocus={e => { if (!errors.confirm) e.currentTarget.style.borderColor = 'var(--ac)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.08)' }}
                    onBlur={e => { if (!errors.confirm) e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.boxShadow = 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: '0.8rem', padding: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--t2)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--t4)' }}
                  >{showConfirm ? '●' : '○'}</button>
                </div>
                {errors.confirm && <span style={{ fontSize: '0.72rem', color: 'var(--err)', fontFamily: 'var(--mn)', marginTop: 4, display: 'block' }}>{errors.confirm}</span>}
                {/* Match indicator */}
                {confirm.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      {pass === confirm
                        ? <polyline points="2,5 4.5,7.5 8,2.5" stroke="var(--ok)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        : <><line x1="2" y1="2" x2="8" y2="8" stroke="var(--err)" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="2" x2="2" y2="8" stroke="var(--err)" strokeWidth="1.5" strokeLinecap="round" /></>
                      }
                    </svg>
                    <span style={{ fontSize: '0.68rem', color: pass === confirm ? 'var(--ok)' : 'var(--err)', fontFamily: 'var(--mn)' }}>
                      {pass === confirm ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: loading ? 'var(--s4)' : '#7c3aed', color: '#fff', fontSize: '0.98rem', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--ft)', transition: `all 0.25s ${E}`, boxShadow: '0 4px 16px rgba(124,58,237,0.2)' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.3)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.2)' }}
              >{loading ? 'Updating…' : 'Update Password'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
