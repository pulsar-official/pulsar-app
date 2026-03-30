'use client'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ps-login *{margin:0;padding:0;box-sizing:border-box}
.ps-login{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd2:rgba(255,255,255,0.08);--bd3:rgba(255,255,255,0.14);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--err:#f87171;--ft:'Space Grotesk',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;overflow:hidden}
@keyframes plFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes plGridPulse{0%,100%{opacity:0.015}50%{opacity:0.035}}
@keyframes plShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes plDotFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.15)}}
.ps-login ::-webkit-scrollbar{width:4px}.ps-login ::-webkit-scrollbar-track{background:transparent}.ps-login ::-webkit-scrollbar-thumb{background:rgba(167,139,250,.15);border-radius:3px}
`

export default function SignInPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [resetStep, setResetStep] = useState<'none' | 'email' | 'sent'>('none')

  useEffect(() => {
    if (!document.getElementById('ps-login-css')) {
      const s = document.createElement('style'); s.id = 'ps-login-css'; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!pass) e.pass = 'Password is required'
    return e
  }

  const submit = async () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length) { setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) {
        setErrors({ pass: error.message }); setShake(true); setTimeout(() => setShake(false), 500)
      } else {
        router.push('/waitlist')
      }
    } finally { setLoading(false) }
  }

  const sendResetLink = async () => {
    if (!email.trim()) { setErrors({ email: 'Enter your email first' }); setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/auth/callback?type=recovery`,
      })
      if (error) {
        setErrors({ email: error.message }); setShake(true); setTimeout(() => setShake(false), 500)
      } else {
        setResetStep('sent'); setErrors({})
      }
    } finally { setLoading(false) }
  }

  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', borderRadius: 8, background: 'var(--s3)',
    border: `1px solid ${errors[field] ? 'var(--err)' : 'var(--bd2)'}`,
    color: 'var(--t1)', fontSize: '0.95rem', fontFamily: 'var(--ft)', outline: 'none', transition: `all 0.2s ${E}`,
  })
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 7 }

  return (
    <div className="ps-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(167,139,250,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%,black 0%,transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%,black 0%,transparent 70%)', animation: 'plGridPulse 8s ease infinite' }} />
      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.06),transparent 55%)', pointerEvents: 'none' }} />
      {[{ top:'18%',left:'22%',size:5,color:'#a78bfa',delay:'0s' },{ top:'72%',left:'78%',size:4,color:'#818cf8',delay:'1s' },{ top:'28%',left:'75%',size:3,color:'#e879f9',delay:'2s' },{ top:'68%',left:'18%',size:4,color:'#6ee7b7',delay:'0.5s' }].map((d,i)=>(
        <div key={i} style={{ position:'absolute',top:d.top,left:d.left,width:d.size,height:d.size,borderRadius:'50%',background:d.color,opacity:0.25,pointerEvents:'none',animation:`plDotFloat 4s ease-in-out ${d.delay} infinite` }} />
      ))}
      {/* Card */}
      <div style={{ position:'relative',zIndex:1,width:400,padding:'36px 32px',background:'rgba(12,12,20,0.85)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:'1px solid var(--bd2)',borderRadius:18,boxShadow:'0 24px 80px rgba(0,0,0,0.5)', animation:`plFadeIn 0.6s ${E}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:28 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#a78bfa,#7c3aed)',display:'grid',placeItems:'center',fontSize:14,fontWeight:700,color:'#fff',boxShadow:'0 0 20px rgba(167,139,250,0.2)' }}>P</div>
          <span style={{ fontWeight:700,fontSize:'1.15rem',letterSpacing:'-0.02em' }}>Pulsar</span>
        </div>
        <h1 style={{ fontSize:'1.6rem',fontWeight:700,letterSpacing:'-0.03em',marginBottom:6 }}>{resetStep === 'none' ? 'Welcome back' : 'Reset password'}</h1>
        <p style={{ fontSize:'0.92rem',color:'var(--t2)',marginBottom:28,lineHeight:1.5 }}>{resetStep === 'none' ? 'Sign in to continue to your workspace.' : resetStep === 'email' ? 'Enter your email to receive a reset link.' : 'Check your inbox for a password reset link.'}</p>

        {/* Form */}
        <div style={{ animation: shake ? 'plShake 0.4s ease' : 'none' }}>
          {resetStep === 'none' && (<>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(er=>{const n={...er};delete n.email;return n})}} placeholder="jane@example.com" style={inputStyle('email')}
                onFocus={e=>{if(!errors.email)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
                onBlur={e=>{if(!errors.email)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
              />
              {errors.email && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.email}</span>}
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
                <label style={{ ...labelStyle,marginBottom:0 }}>Password</label>
                <button onClick={()=>{setResetStep('email');setErrors({})}} style={{ fontSize:'0.75rem',color:'var(--ac)',textDecoration:'none',fontWeight:500,background:'none',border:'none',cursor:'pointer',fontFamily:'var(--ft)',padding:0 }}>Forgot password?</button>
              </div>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={pass} onChange={e=>{setPass(e.target.value);setErrors(er=>{const n={...er};delete n.pass;return n})}} placeholder="Enter your password" style={{ ...inputStyle('pass'),paddingRight:44 }}
                  onFocus={e=>{if(!errors.pass)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
                  onBlur={e=>{if(!errors.pass)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
                  onKeyDown={e=>{if(e.key==='Enter')submit()}}
                />
                <button onClick={()=>setShowPass(!showPass)} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t4)',cursor:'pointer',fontSize:'0.8rem',padding:4 }}
                  onMouseEnter={e=>{e.currentTarget.style.color='var(--t2)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--t4)'}}
                >{showPass?'●':'○'}</button>
              </div>
              {errors.pass && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.pass}</span>}
            </div>
            <button onClick={submit} disabled={loading} style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:loading?'var(--s4)':'linear-gradient(135deg,#a78bfa,#7c3aed)',color:'#fff',fontSize:'0.98rem',fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'var(--ft)',transition:`all 0.25s ${E}`,boxShadow:'0 4px 16px rgba(167,139,250,0.15)' }}
              onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(167,139,250,0.25)'}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(167,139,250,0.15)'}}
            >{loading?'Signing in...':'Sign In'}</button>
          </>)}

          {resetStep === 'email' && (<>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(er=>{const n={...er};delete n.email;return n})}} placeholder="jane@example.com" style={inputStyle('email')}
                onFocus={e=>{if(!errors.email)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
                onBlur={e=>{if(!errors.email)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
                onKeyDown={e=>{if(e.key==='Enter')sendResetLink()}}
              />
              {errors.email && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.email}</span>}
            </div>
            <button onClick={sendResetLink} disabled={loading} style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:loading?'var(--s4)':'linear-gradient(135deg,#a78bfa,#7c3aed)',color:'#fff',fontSize:'0.98rem',fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'var(--ft)',transition:`all 0.25s ${E}`,boxShadow:'0 4px 16px rgba(167,139,250,0.15)',marginBottom:12 }}
              onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(167,139,250,0.25)'}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(167,139,250,0.15)'}}
            >{loading?'Sending...':'Send Reset Link'}</button>
            <button onClick={()=>{setResetStep('none');setErrors({})}} style={{ width:'100%',padding:12,borderRadius:10,border:'1px solid var(--bd2)',background:'transparent',color:'var(--t2)',fontSize:'0.92rem',fontWeight:500,cursor:'pointer',fontFamily:'var(--ft)',transition:`all 0.2s ${E}` }}>Back to sign in</button>
          </>)}

          {resetStep === 'sent' && (
            <div style={{ textAlign:'center',padding:'24px 0' }}>
              <div style={{ fontSize:'2rem',marginBottom:12 }}>📬</div>
              <p style={{ color:'var(--ok)',fontWeight:600,marginBottom:8 }}>Reset link sent!</p>
              <p style={{ color:'var(--t2)',fontSize:'0.88rem',lineHeight:1.5,marginBottom:20 }}>Check your inbox for a link to reset your password.</p>
              <button onClick={()=>{setResetStep('none');setErrors({})}} style={{ padding:'10px 24px',borderRadius:8,border:'1px solid var(--bd2)',background:'transparent',color:'var(--t2)',fontSize:'0.88rem',cursor:'pointer',fontFamily:'var(--ft)' }}>Back to sign in</button>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center',marginTop:24,fontSize:'0.88rem',color:'var(--t3)' }}>
          Not on the waitlist yet? <a href="/sign-up" style={{ color:'var(--ac)',textDecoration:'none',fontWeight:600 }}>Join now</a>
        </p>
      </div>
    </div>
  )
}
