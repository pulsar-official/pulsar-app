'use client'
import { useState, useEffect } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

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
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [resetStep, setResetStep] = useState<'none' | 'email' | 'code'>('none')
  const [resetCode, setResetCode] = useState('')
  const [newPass, setNewPass] = useState('')

  useEffect(() => {
    if (!document.getElementById('ps-login-css')) {
      const s = document.createElement('style'); s.id = 'ps-login-css'; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  const handleOAuth = async (provider: 'oauth_google' | 'oauth_github') => {
    if (!isLoaded || !signIn) return
    await signIn.authenticateWithRedirect({ strategy: provider, redirectUrl: '/sso-callback', redirectUrlComplete: '/waitlist' })
  }

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
    if (!isLoaded || !signIn) return
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password: pass })
      if (result.status === 'complete') { await setActive!({ session: result.createdSessionId }); router.push('/waitlist') }
    } catch (err: unknown) {
      const errObj = (err as { errors?: { longMessage?: string; message?: string; code?: string }[] })?.errors?.[0]
      if (errObj?.code === 'not_allowed_access' || errObj?.message?.toLowerCase().includes('waitlist')) {
        router.push('/waitlist'); return
      }
      const msg = errObj?.longMessage ?? 'Invalid email or password'
      setErrors({ pass: msg }); setShake(true); setTimeout(() => setShake(false), 500)
    } finally { setLoading(false) }
  }

  const sendResetCode = async () => {
    if (!email.trim()) { setErrors({ email: 'Enter your email first' }); setShake(true); setTimeout(() => setShake(false), 500); return }
    if (!isLoaded || !signIn) return
    setLoading(true)
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email })
      setResetStep('code'); setErrors({})
    } catch (err: unknown) {
      const errObj = (err as { errors?: { longMessage?: string }[] })?.errors?.[0]
      setErrors({ email: errObj?.longMessage ?? 'Could not send reset code' }); setShake(true); setTimeout(() => setShake(false), 500)
    } finally { setLoading(false) }
  }

  const submitReset = async () => {
    const e: Record<string, string> = {}
    if (!resetCode.trim()) e.code = 'Code is required'
    if (!newPass) e.newPass = 'New password is required'
    else if (newPass.length < 8) e.newPass = 'Password must be at least 8 characters'
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(() => setShake(false), 500); return }
    if (!isLoaded || !signIn) return
    setLoading(true)
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code: resetCode, password: newPass })
      if (result.status === 'complete') { await setActive!({ session: result.createdSessionId }); router.push('/waitlist') }
    } catch (err: unknown) {
      const errObj = (err as { errors?: { longMessage?: string }[] })?.errors?.[0]
      setErrors({ code: errObj?.longMessage ?? 'Invalid code or password' }); setShake(true); setTimeout(() => setShake(false), 500)
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
        <p style={{ fontSize:'0.92rem',color:'var(--t2)',marginBottom:28,lineHeight:1.5 }}>{resetStep === 'none' ? 'Sign in to continue to your workspace.' : resetStep === 'email' ? 'Enter your email to receive a reset code.' : 'Enter the code sent to your email and your new password.'}</p>
        {/* OAuth */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24 }}>
          {[{ label:'Google', provider:'oauth_google' as const, icon:<svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
           { label:'GitHub', provider:'oauth_github' as const, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> },
          ].map((s,i)=>(
            <button key={i} onClick={()=>handleOAuth(s.provider)} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:9,padding:11,borderRadius:8,border:'1px solid var(--bd2)',background:'var(--s2)',color:'var(--t2)',fontSize:'0.88rem',fontWeight:500,cursor:'pointer',fontFamily:'var(--ft)',transition:`all 0.2s ${E}` }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--bd3)';e.currentTarget.style.background='var(--s3)';e.currentTarget.style.color='#fff'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.background='var(--s2)';e.currentTarget.style.color='var(--t2)'}}
            >{s.icon}{s.label}</button>
          ))}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24 }}>
          <div style={{ flex:1,height:1,background:'var(--bd2)' }} />
          <span style={{ fontSize:'0.7rem',fontFamily:'var(--mn)',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.02em' }}>or</span>
          <div style={{ flex:1,height:1,background:'var(--bd2)' }} />
        </div>
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
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:24 }}>
              <div onClick={()=>setRemember(!remember)} style={{ width:18,height:18,borderRadius:5,flexShrink:0,cursor:'pointer',border:`1.5px solid ${remember?'var(--ac)':'rgba(255,255,255,0.14)'}`,background:remember?'rgba(167,139,250,0.15)':'transparent',display:'grid',placeItems:'center',transition:`all 0.15s ${E}` }}>
                {remember&&<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 4.5"/></svg>}
              </div>
              <span style={{ fontSize:'0.85rem',color:'var(--t3)' }}>Remember me</span>
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
                onKeyDown={e=>{if(e.key==='Enter')sendResetCode()}}
              />
              {errors.email && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.email}</span>}
            </div>
            <button onClick={sendResetCode} disabled={loading} style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:loading?'var(--s4)':'linear-gradient(135deg,#a78bfa,#7c3aed)',color:'#fff',fontSize:'0.98rem',fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'var(--ft)',transition:`all 0.25s ${E}`,boxShadow:'0 4px 16px rgba(167,139,250,0.15)',marginBottom:12 }}
              onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(167,139,250,0.25)'}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(167,139,250,0.15)'}}
            >{loading?'Sending...':'Send Reset Code'}</button>
            <button onClick={()=>{setResetStep('none');setErrors({})}} style={{ width:'100%',padding:12,borderRadius:10,border:'1px solid var(--bd2)',background:'transparent',color:'var(--t2)',fontSize:'0.92rem',fontWeight:500,cursor:'pointer',fontFamily:'var(--ft)',transition:`all 0.2s ${E}` }}>Back to sign in</button>
          </>)}

          {resetStep === 'code' && (<>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Reset Code</label>
              <input type="text" value={resetCode} onChange={e=>{setResetCode(e.target.value);setErrors(er=>{const n={...er};delete n.code;return n})}} placeholder="Enter 6-digit code" style={inputStyle('code')}
                onFocus={e=>{if(!errors.code)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
                onBlur={e=>{if(!errors.code)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
              />
              {errors.code && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.code}</span>}
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPass} onChange={e=>{setNewPass(e.target.value);setErrors(er=>{const n={...er};delete n.newPass;return n})}} placeholder="Enter new password" style={inputStyle('newPass')}
                onFocus={e=>{if(!errors.newPass)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
                onBlur={e=>{if(!errors.newPass)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
                onKeyDown={e=>{if(e.key==='Enter')submitReset()}}
              />
              {errors.newPass && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.newPass}</span>}
            </div>
            <button onClick={submitReset} disabled={loading} style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:loading?'var(--s4)':'linear-gradient(135deg,#a78bfa,#7c3aed)',color:'#fff',fontSize:'0.98rem',fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'var(--ft)',transition:`all 0.25s ${E}`,boxShadow:'0 4px 16px rgba(167,139,250,0.15)',marginBottom:12 }}
              onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(167,139,250,0.25)'}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(167,139,250,0.15)'}}
            >{loading?'Resetting...':'Reset Password'}</button>
            <button onClick={()=>{setResetStep('email');setErrors({});setResetCode('');setNewPass('')}} style={{ width:'100%',padding:12,borderRadius:10,border:'1px solid var(--bd2)',background:'transparent',color:'var(--t2)',fontSize:'0.92rem',fontWeight:500,cursor:'pointer',fontFamily:'var(--ft)',transition:`all 0.2s ${E}` }}>Resend code</button>
          </>)}
        </div>
        <p style={{ textAlign:'center',marginTop:24,fontSize:'0.88rem',color:'var(--t3)' }}>
          Not on the waitlist yet? <a href="/sign-up" style={{ color:'var(--ac)',textDecoration:'none',fontWeight:600 }}>Join now</a>
        </p>
      </div>
    </div>
  )
}
