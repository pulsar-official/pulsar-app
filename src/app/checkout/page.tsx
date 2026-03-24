'use client'
import { useState, Suspense } from 'react'
import { SignIn, SignUp, useUser } from '@clerk/nextjs'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useSearchParams, useRouter } from 'next/navigation'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const AMOUNTS: Record<string, { monthly: number; yearly: number }> = {
  molecule: { monthly: 1200, yearly: 10000 },
  neuron:   { monthly: 2000, yearly: 17000 },
  quantum:  { monthly: 3000, yearly: 25000 },
}

const SA = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#a78bfa', colorBackground: '#0f0f18',
    colorText: '#eeeef5', colorTextSecondary: '#a0a0b8',
    colorDanger: '#f87171', fontFamily: "'Space Grotesk',system-ui,sans-serif",
    borderRadius: '8px', spacingUnit: '5px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid rgba(167,139,250,0.5)', boxShadow: '0 0 0 3px rgba(167,139,250,0.12)' },
    '.Label': { fontWeight: '500', marginBottom: '6px' },
  },
}

const CA = {
  variables: {
    colorPrimary: '#a78bfa', colorBackground: '#0f0f18',
    colorText: '#eeeef5', colorTextSecondary: '#a0a0b8',
    colorNeutral: '#18181f', colorDanger: '#f87171',
    fontFamily: "'Space Grotesk',system-ui,sans-serif", borderRadius: '8px',
  },
  elements: {
    card: { background: 'transparent', boxShadow: 'none', border: 'none', padding: '0' },
    headerTitle: { color: '#eeeef5', fontSize: '1rem', fontWeight: '700' },
    headerSubtitle: { color: '#7878a0', fontSize: '0.82rem' },
    formButtonPrimary: { background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', fontWeight: '600' },
    formFieldInput: { background: '#111119', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef5' },
    formFieldLabel: { color: '#a0a0b8', fontSize: '0.8rem', fontWeight: '500' },
    footerActionText: { color: '#7878a0' },
    footerActionLink: { color: '#a78bfa' },
    dividerText: { color: '#65657a' },
    dividerLine: { background: 'rgba(255,255,255,0.06)' },
    socialButtonsBlockButton: { background: '#18181f', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef5' },
  },
}

const iS = { width: '100%', padding: '10px 14px', background: '#111119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#eeeef5', fontSize: '0.92rem', fontFamily: "'Space Grotesk',system-ui,sans-serif", outline: 'none', boxSizing: 'border-box' as const, transition: 'border 0.15s' }
const lS = { display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#a0a0b8', marginBottom: 6 }
const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.border = '1px solid rgba(167,139,250,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.12)' }
const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }

function PaymentPanel({ priceId, planName, billing, amount }: { priceId: string; planName: string; billing: string; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    if (!email || !/^[^@]+@[^@]+.[^@]+$/.test(email)) { setError('Enter a valid email'); return }
    if (!phone || phone.replace(/D/g, '').length < 7) { setError('Enter a valid phone number'); return }
    setLoading(true); setError(null)
    const { error: subErr } = await elements.submit()
    if (subErr) { setError(subErr.message ?? 'Validation error'); setLoading(false); return }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, planName, email, phone }),
    })
    const { clientSecret, error: srvErr } = await res.json()
    if (srvErr || !clientSecret) { setError(srvErr ?? 'Failed to start checkout'); setLoading(false); return }
    const { error: confErr } = await stripe.confirmPayment({
      elements, clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/dashboard?checkout=success&plan=' + encodeURIComponent(planName),
        payment_method_data: { billing_details: { email, phone } },
        receipt_email: email,
      },
    })
    if (confErr) { setError(confErr.message ?? 'Payment failed'); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ padding: '14px 16px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 2 }}>{planName}</div>
          <div style={{ fontSize: '0.76rem', color: '#7878a0' }}>{billing === 'yearly' ? 'Billed annually' : 'Billed monthly'} · cancel anytime</div>
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#eeeef5' }}>
          ${(amount / 100).toFixed(0)}<span style={{ fontSize: '0.72rem', color: '#7878a0', fontWeight: 400 }}>/mo</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lS}>Email *</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={iS} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={lS}>Phone * <span style={{ fontSize: '0.7rem', color: '#65657a', fontFamily: "'JetBrains Mono',monospace" }}>2FA</span></label>
          <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={iS} onFocus={focus} onBlur={blur} />
        </div>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p style={{ color: '#f87171', fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace", margin: 0 }}>{error}</p>}
      <button type="submit" disabled={!stripe || loading} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
        {loading ? 'Processing...' : 'Subscribe to ' + planName}
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.73rem', color: '#65657a', margin: '-4px 0 0', fontFamily: "'JetBrains Mono',monospace" }}>
        🔒 secured by stripe · phone used for 2FA only
      </p>
    </form>
  )
}

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const priceId = params.get('priceId') ?? ''
  const planName = params.get('plan') ?? ''
  const billing = params.get('billing') ?? 'monthly'
  const amount = AMOUNTS[planName.toLowerCase()]?.[billing === 'yearly' ? 'yearly' : 'monthly'] ?? 1200

  if (!planName) { router.push('/pricing'); return null }

  const afterUrl = '/checkout?' + params.toString()
  const noStripe = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isSignedIn ? '320px 1fr' : '1fr 1fr', minHeight: 'calc(100vh - 65px)', transition: 'grid-template-columns 0.4s ease' }}>
      {/* LEFT — Account */}
      <div style={{ padding: '48px 44px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>// step 1</p>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 20px', color: '#eeeef5' }}>
          {isSignedIn ? 'Account confirmed' : 'Sign in to continue'}
        </h2>
        {isSignedIn ? (
          /* Already signed in */
          <div style={{ padding: '18px 20px', background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(110,231,183,0.15)', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.9rem' }}>Ready to pay</div>
              <div style={{ color: '#7878a0', fontSize: '0.8rem', marginTop: 2 }}>{user?.emailAddresses[0]?.emailAddress}</div>
            </div>
          </div>
        ) : (
          /* Auth toggle + Clerk component */
          <>
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
              {(['signin', 'signup'] as const).map(mode => (
                <button key={mode} onClick={() => setAuthMode(mode)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Space Grotesk',system-ui,sans-serif", cursor: 'pointer', transition: 'all 0.2s',
                    background: authMode === mode ? '#18182a' : 'transparent',
                    color: authMode === mode ? '#eeeef5' : '#65657a',
                  }}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
            {authMode === 'signin'
              ? <SignIn  routing="hash" afterSignInUrl={afterUrl}  signUpUrl={'#'} appearance={CA} />
              : <SignUp  routing="hash" afterSignUpUrl={afterUrl}  signInUrl={'#'} appearance={CA} />
            }
          </>
        )}
      </div>

      {/* RIGHT — Payment */}
      <div style={{ padding: '48px 44px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Lock overlay when not signed in */}
        {!isSignedIn && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,13,0.7)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: '2rem' }}>🔒</div>
            <p style={{ color: '#7878a0', fontSize: '0.88rem', textAlign: 'center', maxWidth: 220, lineHeight: 1.5, margin: 0 }}>
              Complete step 1 to unlock payment
            </p>
          </div>
        )}
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>// step 2</p>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 24px', color: '#eeeef5' }}>Payment details</h2>
        {noStripe ? (
          <div style={{ padding: '28px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>⚙️</div>
            <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 8 }}>{planName} — {billing}</div>
            <div style={{ color: '#7878a0', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Payment processing is being set up.<br />
              <a href="mailto:hello@pulsar.zone" style={{ color: '#a78bfa', textDecoration: 'none' }}>Email us</a> to complete your subscription manually.
            </div>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ mode: 'subscription', amount, currency: 'usd', appearance: SA }}>
            <PaymentPanel priceId={priceId} planName={planName} billing={billing} amount={amount} />
          </Elements>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07070d', fontFamily: "'Space Grotesk',system-ui,sans-serif", color: '#fff' }}>
      <div style={{ padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 65, boxSizing: 'border-box' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Pulsar</span>
        </a>
        <a href="/pricing" style={{ fontSize: '0.82rem', color: '#65657a', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace" }}>← back to pricing</a>
      </div>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#65657a', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.85rem' }}>loading...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
