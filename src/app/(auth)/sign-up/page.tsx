'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ps-auth *{margin:0;padding:0;box-sizing:border-box}
.ps-auth{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd2:rgba(255,255,255,0.08);--bd3:rgba(255,255,255,0.14);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--err:#f87171;--ft:'Space Grotesk',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;overflow:hidden}
@keyframes psOrbit1{from{transform:rotate(0) translateX(180px) rotate(0)}to{transform:rotate(360deg) translateX(180px) rotate(-360deg)}}
@keyframes psOrbit2{from{transform:rotate(0) translateX(260px) rotate(0)}to{transform:rotate(360deg) translateX(260px) rotate(-360deg)}}
@keyframes psFadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes psShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.ps-auth ::-webkit-scrollbar{width:4px}.ps-auth ::-webkit-scrollbar-track{background:transparent}.ps-auth ::-webkit-scrollbar-thumb{background:rgba(167,139,250,.15);border-radius:3px}
`

function StrengthMeter({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0
    if (password.length >= 8) s++; if (password.length >= 12) s++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++
    if (/d/.test(password)) s++; if (/[^A-Za-z0-9]/.test(password)) s++
    return Math.min(s, 4)
  }, [password])
  const labels = ['','Weak','Fair','Good','Strong']
  const colors = ['','#f87171','#fbbf24','#a78bfa','#6ee7b7']
  if (!password) return null
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex',gap:4,marginBottom:6 }}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{ flex:1,height:3,borderRadius:2,background:i<=score?colors[score]:'rgba(255,255,255,0.06)',transition:'all 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize:'0.7rem',fontFamily:'var(--mn)',color:colors[score],fontWeight:500 }}>{labels[score]}</span>
    </div>
  )
}

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [verifyStep, setVerifyStep] = useState<'email' | null>(null)
  const [emailCode, setEmailCode] = useState('')

  useEffect(() => {
    if (!document.getElementById('ps-auth-css')) {
      const s = document.createElement('style'); s.id = 'ps-auth-css'; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  const handleOAuth = async (provider: 'oauth_google' | 'oauth_github') => {
    if (!isLoaded || !signUp) return
    await signUp.authenticateWithRedirect({ strategy: provider, redirectUrl: '/sso-callback', redirectUrlComplete: '/waitlist' })
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) e.email = 'Invalid email'
    if (pass.length < 8) e.pass = 'At least 8 characters'
    if (!agreed) e.agreed = 'Please accept the terms'
    return e
  }

  const submit = async () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length) { setShake(true); setTimeout(() => setShake(false), 500); return }
    if (!isLoaded || !signUp) return
    setLoading(true)
    try {
      const parts = name.trim().split(' ')
      await signUp.create({ emailAddress: email, password: pass, firstName: parts[0], lastName: parts.slice(1).join(' ') || undefined })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setVerifyStep('email')
    } catch (err: unknown) {
      const msg = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0]?.longMessage ?? 'Something went wrong'
      setErrors({ email: msg }); setShake(true); setTimeout(() => setShake(false), 500)
    } finally { setLoading(false) }
  }

  const verifyEmail = async () => {
    if (!isLoaded || !signUp) return
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: emailCode })
      if (result.status === 'complete') {
        if (result.createdSessionId) await setActive!({ session: result.createdSessionId })
        router.push('/waitlist')
      }
    } catch (err: unknown) {
      const msg = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0]?.longMessage ?? 'Invalid code'
      setErrors({ emailCode: msg })
    } finally { setLoading(false) }
  }

  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const inputStyle = (field: string): React.CSSProperties => ({
    width:'100%', padding:'12px 14px', borderRadius:8, background:'var(--s3)',
    border:`1px solid ${errors[field]?'var(--err)':'var(--bd2)'}`,
    color:'var(--t1)', fontSize:'0.95rem', fontFamily:'var(--ft)', outline:'none', transition:`all 0.2s ${E}`,
  })
  const labelStyle: React.CSSProperties = { display:'block', fontSize:'0.72rem', fontFamily:'var(--mn)', fontWeight:600, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }

  // Email verification screen
  if (verifyStep === 'email') {
    return (
      <div className="ps-auth" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}>
        <div style={{ position:'relative',zIndex:1,width:400,padding:'36px 32px',background:'rgba(12,12,20,0.85)',backdropFilter:'blur(24px)',border:'1px solid var(--bd2)',borderRadius:18,boxShadow:'0 24px 80px rgba(0,0,0,0.5)',animation:`psFadeIn 0.5s ${E}` }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:28 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#a78bfa,#7c3aed)',display:'grid',placeItems:'center',fontSize:14,fontWeight:700,color:'#fff' }}>P</div>
            <span style={{ fontWeight:700,fontSize:'1.15rem',letterSpacing:'-0.02em' }}>Pulsar</span>
          </div>
          <h1 style={{ fontSize:'1.5rem',fontWeight:700,letterSpacing:'-0.03em',marginBottom:8 }}>Check your email</h1>
          <p style={{ fontSize:'0.9rem',color:'var(--t2)',marginBottom:28,lineHeight:1.5 }}>We sent a verification code to <strong style={{ color:'var(--t1)' }}>{email}</strong></p>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Verification code</label>
            <input value={emailCode} onChange={e=>{setEmailCode(e.target.value);setErrors({})}} placeholder="Enter 6-digit code" style={inputStyle('emailCode')}
              onFocus={e=>{e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
              onBlur={e=>{e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
              onKeyDown={e=>{if(e.key==='Enter')verifyEmail()}}
            />
            {errors.emailCode && <span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.emailCode}</span>}
          </div>
          <button onClick={verifyEmail} disabled={loading} style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:loading?'var(--s4)':'linear-gradient(135deg,#a78bfa,#7c3aed)',color:'#fff',fontSize:'0.98rem',fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'var(--ft)',transition:`all 0.25s ${E}` }}
          >{loading?'Verifying...':'Verify Email'}</button>
          <p style={{ textAlign:'center',marginTop:16,fontSize:'0.85rem',color:'var(--t3)' }}>
            Wrong email? <button onClick={()=>setVerifyStep(null)} style={{ background:'none',border:'none',color:'var(--ac)',cursor:'pointer',fontWeight:600,fontFamily:'var(--ft)',fontSize:'0.85rem',padding:0 }}>Go back</button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ps-auth" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',position:'relative' }}>
      {/* Orbitals */}
      <div style={{ position:'absolute',top:'45%',left:'25%',transform:'translate(-50%,-50%)',pointerEvents:'none' }}>
        {[{ size:360,border:'rgba(167,139,250,0.04)',dot:'#a78bfa',dotSize:6,anim:'psOrbit1',dur:'24s' },
          { size:520,border:'rgba(167,139,250,0.025)',dot:'#e879f9',dotSize:4,anim:'psOrbit2',dur:'36s' }].map((o,i)=>(
          <div key={i} style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:o.size,height:o.size,borderRadius:'50%',border:`1px solid ${o.border}` }}>
            <div style={{ position:'absolute',top:-o.dotSize/2,left:'50%',width:o.dotSize,height:o.dotSize,borderRadius:'50%',background:o.dot,opacity:0.4,animation:`${o.anim} ${o.dur} linear infinite` }} />
          </div>
        ))}
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.06),transparent 60%)' }} />
      </div>
      {/* Card */}
      <div style={{ position:'relative',zIndex:1,width:420,padding:'36px 32px',background:'rgba(12,12,20,0.85)',backdropFilter:'blur(24px)',border:'1px solid var(--bd2)',borderRadius:18,boxShadow:'0 24px 80px rgba(0,0,0,0.5)',animation:`psFadeIn 0.6s ${E}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:28 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#a78bfa,#7c3aed)',display:'grid',placeItems:'center',fontSize:14,fontWeight:700,color:'#fff' }}>P</div>
          <span style={{ fontWeight:700,fontSize:'1.15rem',letterSpacing:'-0.02em' }}>Pulsar</span>
        </div>
        <div style={{ fontSize:'0.7rem',fontFamily:'var(--mn)',fontWeight:600,color:'var(--ac)',textTransform:'uppercase',letterSpacing:'0.14em',marginBottom:10 }}>// beta_waitlist</div>
        <h1 style={{ fontSize:'1.6rem',fontWeight:700,letterSpacing:'-0.03em',marginBottom:6 }}>Join the waitlist</h1>
        <p style={{ fontSize:'0.92rem',color:'var(--t2)',marginBottom:28,lineHeight:1.5 }}>Pulsar is in closed beta — claim your spot before it fills up.</p>
        {/* OAuth */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24 }}>
          {[{ label:'Google',provider:'oauth_google' as const, icon:<svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
           { label:'GitHub',provider:'oauth_github' as const, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> },
          ].map((s,i)=>(
            <button key={i} onClick={()=>handleOAuth(s.provider)} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:9,padding:11,borderRadius:8,border:'1px solid var(--bd2)',background:'var(--s2)',color:'var(--t2)',fontSize:'0.88rem',fontWeight:500,cursor:'pointer',fontFamily:'var(--ft)',transition:`all 0.2s ${E}` }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--bd3)';e.currentTarget.style.background='var(--s3)';e.currentTarget.style.color='#fff'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.background='var(--s2)';e.currentTarget.style.color='var(--t2)'}}
            >{s.icon}{s.label}</button>
          ))}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24 }}>
          <div style={{ flex:1,height:1,background:'var(--bd2)' }} /><span style={{ fontSize:'0.7rem',fontFamily:'var(--mn)',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.08em' }}>or continue with email</span><div style={{ flex:1,height:1,background:'var(--bd2)' }} />
        </div>
        {/* Form */}
        <div style={{ animation:shake?'psShake 0.4s ease':'none' }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Full name</label>
            <input value={name} onChange={e=>{setName(e.target.value);setErrors(er=>{const n={...er};delete n.name;return n})}} placeholder="Jane Doe" style={inputStyle('name')}
              onFocus={e=>{if(!errors.name)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
              onBlur={e=>{if(!errors.name)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
            />
            {errors.name&&<span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.name}</span>}
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(er=>{const n={...er};delete n.email;return n})}} placeholder="jane@example.com" style={inputStyle('email')}
              onFocus={e=>{if(!errors.email)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
              onBlur={e=>{if(!errors.email)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
            />
            {errors.email&&<span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom:8 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={pass} onChange={e=>{setPass(e.target.value);setErrors(er=>{const n={...er};delete n.pass;return n})}} placeholder="Min 8 characters" style={{ ...inputStyle('pass'),paddingRight:44 }}
                onFocus={e=>{if(!errors.pass)e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(167,139,250,0.08)'}}
                onBlur={e=>{if(!errors.pass)e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.boxShadow='none'}}
                onKeyDown={e=>{if(e.key==='Enter')submit()}}
              />
              <button onClick={()=>setShowPass(!showPass)} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t4)',cursor:'pointer',fontSize:'0.8rem',padding:4 }}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--t2)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--t4)'}}
              >{showPass?'●':'○'}</button>
            </div>
            {errors.pass&&<span style={{ fontSize:'0.72rem',color:'var(--err)',fontFamily:'var(--mn)',marginTop:4,display:'block' }}>{errors.pass}</span>}
            <StrengthMeter password={pass} />
          </div>
          <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:24,marginTop:16 }}>
            <div onClick={()=>{setAgreed(!agreed);setErrors(er=>{const n={...er};delete n.agreed;return n})}} style={{ width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,cursor:'pointer',border:`1.5px solid ${errors.agreed?'var(--err)':agreed?'var(--ac)':'rgba(255,255,255,0.14)'}`,background:agreed?'rgba(167,139,250,0.15)':'transparent',display:'grid',placeItems:'center',transition:`all 0.15s ${E}` }}>
              {agreed&&<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 4.5"/></svg>}
            </div>
            <span style={{ fontSize:'0.82rem',color:'var(--t3)',lineHeight:1.5 }}>
              I agree to the <a href="#" style={{ color:'var(--ac)',textDecoration:'none' }}>Terms of Service</a> and <a href="#" style={{ color:'var(--ac)',textDecoration:'none' }}>Privacy Policy</a>
            </span>
          </div>
          <button onClick={submit} disabled={loading} style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:loading?'var(--s4)':'linear-gradient(135deg,#a78bfa,#7c3aed)',color:'#fff',fontSize:'0.98rem',fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'var(--ft)',transition:`all 0.25s ${E}`,boxShadow:'0 4px 16px rgba(167,139,250,0.15)' }}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(167,139,250,0.25)'}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(167,139,250,0.15)'}}
          >{loading?'Joining waitlist...':'Join Waitlist'}</button>
        </div>
        <p style={{ textAlign:'center',marginTop:24,fontSize:'0.88rem',color:'var(--t3)' }}>
          Already on the waitlist? <a href="/sign-in" style={{ color:'var(--ac)',textDecoration:'none',fontWeight:600 }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
