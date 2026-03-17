'use client'
import { useState, Suspense } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useSearchParams } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const AMOUNTS: Record<string, { monthly: number; yearly: number }> = {
  molecule: { monthly: 1200, yearly: 12000 },
  neuron:   { monthly: 2000, yearly: 20400 },
  quantum:  { monthly: 3000, yearly: 30000 },
}

const appearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#a78bfa',
    colorBackground: '#111119',
    colorText: '#eeeef5',
    colorTextSecondary: '#a0a0b8',
    colorDanger: '#f87171',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    borderRadius: '8px',
    spacingUnit: '5px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid rgba(167,139,250,0.5)', boxShadow: '0 0 0 3px rgba(167,139,250,0.12)' },
    '.Label': { fontWeight: '500', marginBottom: '6px' },
  },
}

const iStyle = {
  width: '100%', padding: '10px 14px', background: '#111119',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#eeeef5',
  fontSize: '0.92rem', fontFamily: "'Space Grotesk',system-ui,sans-serif",
  outline: 'none', boxSizing: 'border-box' as const, transition: 'border 0.15s',
}

const lblStyle = {
  display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#a0a0b8',
  marginBottom: 6, fontFamily: "'Space Grotesk',system-ui,sans-serif",
}

function CheckoutForm({ priceId, planName }: { priceId: string; planName: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    if (!email || !/^[^@]+@[^@]+.[^@]+$/.test(email)) { setError('Please enter a valid email'); return }
    if (!phone || phone.replace(/D/g, '').length < 7) { setError('Please enter a valid phone number'); return }
    setLoading(true); setError(null)

    const { error: submitErr } = await elements.submit()
    if (submitErr) { setError(submitErr.message ?? 'Validation error'); setLoading(false); return }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, planName, email, phone }),
    })
    const { clientSecret, error: serverErr } = await res.json()
    if (serverErr || !clientSecret) { setError(serverErr ?? 'Failed to start checkout'); setLoading(false); return }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements, clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?checkout=success&plan=${encodeURIComponent(planName)}`,
        payment_method_data: { billing_details: { email, phone } },
        receipt_email: email,
      },
    })
    if (confirmErr) { setError(confirmErr.message ?? 'Payment failed'); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lblStyle}>Email *</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={iStyle}
            onFocus={e => { e.target.style.border = '1px solid rgba(167,139,250,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.12)' }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div>
          <label style={lblStyle}>Phone * <span style={{ fontSize: '0.72rem', color: '#65657a', fontFamily: "'JetBrains Mono',monospace" }}>2FA</span></label>
          <input
            type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            style={iStyle}
            onFocus={e => { e.target.style.border = '1px solid rgba(167,139,250,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.12)' }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 -4px' }} />
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p style={{ color: '#f87171', fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace", margin: 0 }}>{error}</p>}
      <button type="submit" disabled={!stripe || loading} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: loading ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Space Grotesk',sans-serif", transition: 'all 0.2s' }}>
        {loading ? 'Processing...' : `Subscribe to ${planName}`}
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.74rem', color: '#65657a', margin: '-8px 0 0', fontFamily: "'JetBrains Mono',monospace" }}>
        🔒 secured by stripe &middot; phone used for 2FA only
      </p>
    </form>
  )
}

function CheckoutContent() {
  const params = useSearchParams()
  const priceId = params.get('priceId') ?? ''
  const planName = params.get('plan') ?? ''
  const billing = params.get('billing') ?? 'monthly'
  const amount = AMOUNTS[planName.toLowerCase()]?.[billing === 'yearly' ? 'yearly' : 'monthly'] ?? 1200

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono',monospace", color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>// checkout</p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>{planName} plan</h1>
        <p style={{ fontSize: '0.88rem', color: '#a0a0b8', margin: 0 }}>{billing === 'yearly' ? 'Billed annually' : 'Billed monthly'} · cancel anytime</p>
      </div>
      <div style={{ background: '#111119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 28px 24px' }}>
        <Elements stripe={stripePromise} options={{ mode: 'subscription', amount, currency: 'usd', appearance }}>
          <CheckoutForm priceId={priceId} planName={planName} />
        </Elements>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'Space Grotesk',system-ui,sans-serif", color: '#fff' }}>
      <div style={{ padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Pulsar</span>
        </a>
        <a href="/pricing" style={{ fontSize: '0.82rem', color: '#65657a', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace" }}>← back to pricing</a>
      </div>
      <div style={{ padding: '48px 24px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#65657a', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.85rem' }}>loading...</div>}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  )
}
