'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LandingNav from '@/components/Landing/LandingNav'

function useReveal(th = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold: th })
    o.observe(el); return () => o.disconnect()
  }, [th])
  return { ref, v }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.pp *{margin:0;padding:0;box-sizing:border-box}
.pp{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd:rgba(255,255,255,0.04);--bd2:rgba(255,255,255,0.08);--bd3:rgba(255,255,255,0.12);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--ft:'Space Grotesk',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.pp ::-webkit-scrollbar{width:5px}.pp ::-webkit-scrollbar-track{background:transparent}.pp ::-webkit-scrollbar-thumb{background:rgba(167,139,250,.15);border-radius:3px}
@keyframes ppFadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes ppGlow{0%,100%{box-shadow:0 0 20px rgba(167,139,250,.1)}50%{box-shadow:0 0 40px rgba(167,139,250,.2)}}
`

const TIERS = [
  { name: 'Atom',     price: 'Free', yearlyPrice: null,   savePercent: null, period: '',      desc: 'Students & casual users',     accent: '#808099', pop: false, priceIdMonthly: null, priceIdYearly: null,
    features: ['Basic note-taking (Core + Learning)', 'Limited AI assist (50 req/mo)', '1 workspace · 2 collaborators', 'Limited customization', 'Community support'] },
  { name: 'Molecule', price: '$12',  yearlyPrice: '$10',  savePercent: 17,   period: '/mo',   desc: 'Students & solo learners',     accent: '#a78bfa', pop: false, priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MOLECULE_MONTHLY ?? '', priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MOLECULE_YEARLY ?? '',
    features: ['Everything in Atom', 'AI summaries + auto-flashcards', '1 knowledge sector hub', '3 accelerator tools', 'Basic dashboards', 'Google Drive sync'] },
  { name: 'Neuron',   price: '$20',  yearlyPrice: '$17',  savePercent: 15,   period: '/mo',   desc: 'Advanced learners & teams',    accent: '#6ee7b7', pop: true,  priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_NEURON_MONTHLY ?? '', priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_NEURON_YEARLY ?? '',
    features: ['Everything in Molecule', 'Multi-sector support', 'Advanced AI connections', 'Full focus session suite', 'Team workspaces', 'Slack · Anki · TradingView', 'Advanced customization'] },
  { name: 'Quantum',  price: '$30',  yearlyPrice: '$25',  savePercent: 17,   period: '/mo',   desc: 'Teams, researchers & pros',    accent: '#f472b6', pop: false, priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_QUANTUM_MONTHLY ?? '', priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_QUANTUM_YEARLY ?? '',
    features: ['Everything in Neuron', 'Unlimited sectors + knowledge bridging', 'Full AI research assistant', 'Priority collab (unlimited)', 'Advanced analytics + insights', 'Full API suite + exports', 'Early access to new pillars'] },
]

const COMPARE_ROWS = [
  { label: 'Notes pillars',    vals: ['3', '5', 'All 7', 'All 7'] },
  { label: 'AI Assist',        vals: ['Basic (50/mo)', 'Summaries + Quizzes', 'Advanced connections', 'Full research assistant'] },
  { label: 'Workspaces',       vals: ['1', '3', 'Unlimited', 'Unlimited'] },
  { label: 'Collaborators',    vals: ['2', '5', '25', 'Unlimited'] },
  { label: 'Storage',          vals: ['1 GB', '10 GB', '100 GB', 'Unlimited'] },
  { label: 'Integrations',     vals: ['—', 'Google Drive', 'Slack · TradingView · Anki', 'Full suite + API'] },
  { label: 'Customization',    vals: ['Limited', 'Basic', 'Advanced', 'Deep + themes'] },
  { label: 'Support',          vals: ['Community', 'Email', 'Priority', 'Dedicated'] },
]

const FAQS = [
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade instantly, downgrade at the end of your billing cycle. No penalties, no lock-in.' },
  { q: 'Is there a student discount?', a: 'Yes — 40% off any paid plan with a valid .edu email. Apply during checkout.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your data is never deleted. Features beyond your plan become read-only until you upgrade again.' },
  { q: 'Can I use Pulsar offline?', a: 'The desktop app supports offline mode with automatic sync when you reconnect.' },
  { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all paid plans, no questions asked.' },
]

export default function PulsarPricing() {
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  const handleCheckout = (tier: typeof TIERS[number], isYearly: boolean) => {
    // Always go to checkout — price ID may be empty if env vars aren't set yet,
    // the checkout page handles that gracefully.
    const priceId = isYearly && tier.priceIdYearly ? tier.priceIdYearly
      : tier.priceIdMonthly ?? ''
    router.push(`/checkout?priceId=${encodeURIComponent(priceId)}&plan=${encodeURIComponent(tier.name)}&billing=${isYearly ? 'yearly' : 'monthly'}`)
  }
  const hero = useReveal(0.05)
  const compare = useReveal(0.08)
  const faq = useReveal(0.08)
  const E = 'cubic-bezier(0.22,1,0.36,1)'

  useEffect(() => {
    if (!document.getElementById('pp-css')) {
      const s = document.createElement('style'); s.id = 'pp-css'; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  return (
    <div className="pp">
      {/* Nav */}
      <LandingNav />

      {/* Hero */}
      <section ref={hero.ref} style={{ padding: '80px 40px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, opacity: hero.v ? 1 : 0, transform: hero.v ? 'none' : 'translateY(24px)', transition: `all 0.8s ${E}` }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>{'// pricing'}</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 16 }}>Simple pricing.<br />No surprises.</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--t2)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px' }}>One plan for every stage. Upgrade or downgrade anytime.</p>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '6px 8px', borderRadius: 100, background: 'var(--s2)', border: '1px solid var(--bd2)' }}>
            <span onClick={() => setYearly(false)} style={{ fontSize: '0.82rem', fontFamily: 'var(--mn)', color: yearly ? 'var(--t3)' : 'var(--t1)', fontWeight: yearly ? 400 : 600, padding: '5px 14px', borderRadius: 100, background: yearly ? 'transparent' : 'var(--s3)', cursor: 'pointer', transition: `all 0.25s ${E}` }}>Monthly</span>
            <div onClick={() => setYearly(y => !y)} style={{ width: 42, height: 24, borderRadius: 12, background: yearly ? 'var(--ac)' : 'var(--s4)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: yearly ? 21 : 3, transition: `left 0.3s ${E}`, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
            <span onClick={() => setYearly(true)} style={{ fontSize: '0.82rem', fontFamily: 'var(--mn)', color: yearly ? 'var(--t1)' : 'var(--t3)', fontWeight: yearly ? 600 : 400, padding: '5px 14px', borderRadius: 100, background: yearly ? 'var(--s3)' : 'transparent', cursor: 'pointer', transition: `all 0.25s ${E}` }}>Yearly</span>
            {yearly && <span style={{ fontSize: '0.65rem', fontFamily: 'var(--mn)', padding: '3px 10px', borderRadius: 100, background: 'rgba(110,231,183,0.08)', color: 'var(--ok)', border: '1px solid rgba(110,231,183,0.15)', fontWeight: 600 }}>save up to 17%</span>}
          </div>
          <div style={{ marginTop: 16, padding: '8px 18px', borderRadius: 100, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.75rem', fontFamily: 'var(--mn)', color: 'rgba(245,158,11,0.75)' }}>
            <span>🔒</span> Payments open at beta launch · <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>join the waitlist above</span>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {TIERS.map((t, i) => {
            const price = yearly && t.yearlyPrice ? t.yearlyPrice : t.price
            const period = yearly && t.yearlyPrice ? '/mo, billed yearly' : t.period
            return (
              <div key={t.name} style={{ padding: t.pop ? 2 : 0, borderRadius: 16, display: 'flex', background: t.pop ? 'linear-gradient(135deg, #6ee7b7, #38bdf8, #a78bfa)' : 'transparent', animation: `ppFadeUp 0.6s ${E} ${i * 0.08}s both` }}>
                <div style={{ padding: '28px 24px', borderRadius: t.pop ? 14 : 16, flex: 1, display: 'flex', flexDirection: 'column', background: t.pop ? 'var(--s2)' : 'var(--s1)', border: t.pop ? 'none' : '1px solid var(--bd2)', position: 'relative', transition: `all 0.25s ${E}` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${t.accent}22` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {t.pop && <div style={{ position: 'absolute', top: -1, right: 16, padding: '4px 12px', borderRadius: '0 0 8px 8px', fontSize: '0.62rem', fontFamily: 'var(--mn)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'linear-gradient(135deg, #6ee7b7, #38bdf8)', color: '#fff' }}>Best Value</div>}
                  {/* Per-plan % off badge */}
                  {yearly && t.savePercent && (
                    <div style={{ position: 'absolute', top: 14, left: 14, padding: '3px 8px', borderRadius: 6, fontSize: '0.6rem', fontFamily: 'var(--mn)', fontWeight: 700, background: `${t.accent}18`, color: t.accent, border: `1px solid ${t.accent}30` }}>{t.savePercent}% off</div>
                  )}
                  <div style={{ fontSize: '0.82rem', fontFamily: 'var(--mn)', fontWeight: 600, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: yearly && t.savePercent ? 22 : 0 }}>{t.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
                    <span style={{ fontSize: '2.6rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{price}</span>
                    {period && <span style={{ fontSize: '0.85rem', color: 'var(--t3)' }}>{period}</span>}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--t3)', marginBottom: 22, lineHeight: 1.4 }}>{t.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26, flex: 1 }}>
                    {t.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: '0.88rem', color: 'var(--t2)' }}>
                        <span style={{ color: t.accent, fontSize: '0.7rem', flexShrink: 0, marginTop: 3 }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => t.price === 'Free' ? router.push('/sign-up') : undefined}
                    disabled={t.price !== 'Free'}
                    style={{ width: '100%', padding: 13, borderRadius: 8, marginTop: 'auto', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--ft)', transition: `all 0.2s ${E}`, border: t.pop ? 'none' : '1px solid var(--bd2)', background: t.price === 'Free' ? (t.pop ? `linear-gradient(135deg, ${t.accent}, #38bdf8)` : 'transparent') : 'rgba(245,158,11,0.08)', color: t.price === 'Free' ? '#fff' : 'rgba(245,158,11,0.6)', cursor: t.price === 'Free' ? 'pointer' : 'default', opacity: t.price === 'Free' ? 1 : 0.7 }}
                    onMouseEnter={e => { if (t.price === 'Free') { e.currentTarget.style.transform = 'translateY(-1px)'; if (!t.pop) e.currentTarget.style.background = 'var(--s3)' } }}
                    onMouseLeave={e => { if (t.price === 'Free') { e.currentTarget.style.transform = 'none'; if (!t.pop) e.currentTarget.style.background = 'transparent' } }}
                  >{t.price === 'Free' ? 'Start Free' : '🔒 Launching Soon'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Compare Table */}
      <section ref={compare.ref} style={{ padding: '80px 40px', background: 'var(--s1)', borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48, opacity: compare.v ? 1 : 0, transform: compare.v ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{'// compare'}</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>Feature comparison</h2>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--bd2)', background: 'var(--s2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', fontFamily: 'var(--mn)', color: 'var(--t4)', borderBottom: '1px solid var(--bd2)', width: '24%' }}>Feature</th>
                  {TIERS.map(t => (
                    <th key={t.name} style={{ textAlign: 'center', padding: '16px 12px', fontSize: '0.8rem', fontFamily: 'var(--mn)', color: t.accent, borderBottom: '1px solid var(--bd2)', fontWeight: 600 }}>{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, ri) => (
                  <tr key={ri} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '14px 20px', fontSize: '0.87rem', fontWeight: 500, color: 'var(--t2)', borderBottom: ri < COMPARE_ROWS.length - 1 ? '1px solid var(--bd)' : 'none' }}>{row.label}</td>
                    {row.vals.map((val, vi) => (
                      <td key={vi} style={{ textAlign: 'center', padding: '14px 12px', fontSize: '0.84rem', color: val === '—' ? 'var(--t4)' : 'var(--t2)', borderBottom: ri < COMPARE_ROWS.length - 1 ? '1px solid var(--bd)' : 'none' }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faq.ref} style={{ padding: '80px 40px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48, opacity: faq.v ? 1 : 0, transform: faq.v ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{'// faq'}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>Common questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((f, i) => (
            <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: '18px 22px', borderRadius: 12, background: 'var(--s1)', border: '1px solid var(--bd2)', cursor: 'pointer', transition: `all 0.2s ${E}`, opacity: faq.v ? 1 : 0, transform: faq.v ? 'none' : 'translateY(12px)', transitionDelay: `${i * 0.04}s` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd3)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd2)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{f.q}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--t3)', transition: `transform 0.25s ${E}`, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </div>
              <div style={{ maxHeight: openFaq === i ? 120 : 0, overflow: 'hidden', transition: `max-height 0.35s ${E}` }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--t2)', lineHeight: 1.65, paddingTop: 14 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center', borderTop: '1px solid var(--bd)' }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 14 }}>Ready to activate your knowledge?</h2>
        <p style={{ color: 'var(--t2)', fontSize: '1.05rem', marginBottom: 28 }}>Start free. No credit card required.</p>
        <button onClick={() => router.push('/sign-up')} style={{ padding: '14px 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ft)', transition: `all 0.2s ${E}`, animation: 'ppGlow 3s ease infinite' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(167,139,250,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
        >Get Started Free →</button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Pulsar</span>
        </div>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', color: 'var(--t4)' }}>© 2025 Pulsar. All rights reserved.</span>
      </footer>
    </div>
  )
}
