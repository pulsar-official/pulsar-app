'use client'
import { useEffect, useRef, useState } from 'react'
import LandingNav from '@/components/Landing/LandingNav'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
@keyframes clFadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes blobDrift { 0%{transform:translate(0,0)} 50%{transform:translate(16px,-12px)} 100%{transform:translate(0,0)} }
.cl{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--bd:rgba(255,255,255,0.04);--bd2:rgba(255,255,255,0.07);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--font:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;font-family:var(--font);background:var(--bg);color:var(--t1);overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.6}
.cl *{margin:0;padding:0;box-sizing:border-box}
.cl ::-webkit-scrollbar{width:4px}.cl ::-webkit-scrollbar-track{background:transparent}.cl ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.15);border-radius:2px}
.cl a{color:var(--ac);text-decoration:none;transition:color 0.2s}.cl a:hover{color:#c4b5fd}
.cl-max{max-width:760px;margin:0 auto}
@media(max-width:768px){
  .cl-body{padding:64px 20px!important}
  .cl-entry{padding-left:20px!important}
  .cl-footer-inner{flex-direction:column!important;gap:16px!important;text-align:center!important}
  .cl-footer-links{justify-content:center!important}
}
`

function useReveal(th = 0.06) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold: th })
    o.observe(el); return () => o.disconnect()
  }, [th])
  return { ref, v }
}

type EntryType = 'Major' | 'Minor' | 'Patch'

const ENTRIES: { version: string; date: string; tag: string | null; tagColor: string | null; type: EntryType; changes: { type: string; text: string }[] }[] = [
  {
    version: 'v0.3.0', date: 'March 2026', tag: 'latest', tagColor: '#6ee7b7', type: 'Major',
    changes: [
      { type: 'feat', text: 'Focus sessions with commitment mechanics and streak tracking' },
      { type: 'feat', text: 'User preferences sync across devices via Supabase' },
      { type: 'feat', text: 'Full Pulsar sync architecture with real-time updates' },
      { type: 'fix',  text: 'Legal pages (Privacy, Terms) now publicly accessible' },
      { type: 'fix',  text: 'Supabase client made lazy to prevent crash when env vars missing' },
      { type: 'fix',  text: 'Email verification flow with Resend integration' },
    ],
  },
  {
    version: 'v0.2.0', date: 'February 2026', tag: null, tagColor: null, type: 'Major',
    changes: [
      { type: 'feat', text: 'Knowledge graph — spatial canvas with bidirectional links' },
      { type: 'feat', text: 'AI summaries for note clusters' },
      { type: 'feat', text: 'App layout with collapsible sidebar and topbar' },
      { type: 'feat', text: 'Legal pages: Privacy Policy and Terms of Service' },
      { type: 'fix',  text: 'Clerk SSO callback routing fixed for social logins' },
    ],
  },
  {
    version: 'v0.1.0', date: 'January 2026', tag: null, tagColor: null, type: 'Major',
    changes: [
      { type: 'feat', text: 'Core notes and task system — Corespace MVP' },
      { type: 'feat', text: 'Clerk authentication with email verification' },
      { type: 'feat', text: 'Beta waitlist launch — 100 seats total' },
      { type: 'feat', text: 'Stripe checkout integration for future paid plans' },
      { type: 'feat', text: 'Supabase + Drizzle ORM database setup' },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  feat: '#a78bfa',
  fix:  '#6ee7b7',
  perf: '#fbbf24',
  docs: '#38bdf8',
}

const FILTERS: (EntryType | 'All')[] = ['All', 'Major', 'Minor', 'Patch']

function EntryRow({ entry, ei }: { entry: typeof ENTRIES[0]; ei: number }) {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const { ref, v } = useReveal(0.05)
  return (
    <div ref={ref} className="cl-entry" style={{
      paddingLeft: 32, paddingBottom: 56, position: 'relative',
      opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(16px)',
      transition: `all 0.65s ${E} ${ei * 0.08}s`,
    }}>
      {/* Timeline dot */}
      <div style={{
        position: 'absolute', left: -4, top: 6, width: 9, height: 9, borderRadius: '50%', zIndex: 1,
        background: ei === 0 ? '#a78bfa' : '#222236',
        border: `1px solid ${ei === 0 ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
      }} />
      {/* Version header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#eeeef5', letterSpacing: '-0.01em', fontFamily: "'JetBrains Mono',monospace" }}>{entry.version}</span>
        {entry.tag && entry.tagColor && (
          <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 100, background: entry.tagColor + '12', color: entry.tagColor, border: `1px solid ${entry.tagColor}25`, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: "'JetBrains Mono',monospace" }}>{entry.tag}</span>
        )}
        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', color: '#45455a', fontFamily: "'JetBrains Mono',monospace" }}>{entry.type}</span>
        <span style={{ fontSize: '0.72rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace" }}>— {entry.date}</span>
      </div>
      {/* Changes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entry.changes.map((c, ci) => (
          <div key={ci} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              background: (TYPE_COLORS[c.type] ?? '#65657a') + '10',
              color: TYPE_COLORS[c.type] ?? '#65657a',
              letterSpacing: '0.04em', flexShrink: 0, marginTop: 1,
              fontFamily: "'JetBrains Mono',monospace",
            }}>{c.type}</span>
            <span style={{ fontSize: '0.82rem', color: '#a0a0b8', lineHeight: 1.55 }}>{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChangelogPage() {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const [scrolled, setScrolled] = useState(false)
  const [filter, setFilter] = useState<EntryType | 'All'>('All')
  const hero = useReveal(0.04)

  useEffect(() => {
    const id = 'cl-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const filtered = filter === 'All' ? ENTRIES : ENTRIES.filter(e => e.type === filter)

  return (
    <div className="cl">
      <LandingNav scrolled={scrolled} />

      {/* Hero */}
      <section ref={hero.ref} className="cl-body cl-max" style={{
        padding: '80px 48px 48px', position: 'relative', overflow: 'hidden',
        opacity: hero.v ? 1 : 0, transform: hero.v ? 'none' : 'translateY(20px)',
        transition: `all 0.7s ${E}`,
      }}>
        {/* Blob */}
        <div aria-hidden style={{ position: 'absolute', top: '-40px', right: '-40px', width: 320, height: 260, borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%', background: '#818cf8', opacity: 0.05, pointerEvents: 'none', animation: 'blobDrift 24s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>// changelog</div>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>What's new in Pulsar.</h1>
          <p style={{ color: '#65657a', fontSize: '0.88rem', lineHeight: 1.65, fontFamily: "'Inter',system-ui,sans-serif" }}>Every update, fix, and ship — in order. Follow along as we build.</p>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="cl-body cl-max" style={{ padding: '0 48px 40px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: filter === f ? 'rgba(167,139,250,0.1)' : 'transparent',
              color: filter === f ? '#a78bfa' : '#45455a',
              fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: "'JetBrains Mono',monospace",
              transition: `all 0.15s ${E}`,
              borderBottom: filter === f ? '2px solid #a78bfa' : '2px solid transparent',
            }}
              onMouseEnter={e => { if (filter !== f) e.currentTarget.style.color = '#65657a' }}
              onMouseLeave={e => { if (filter !== f) e.currentTarget.style.color = '#45455a' }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Timeline entries */}
      <section className="cl-body cl-max" style={{ padding: '0 48px 96px' }}>
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: 0, top: 8, bottom: 0, width: 1, background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.length > 0
              ? filtered.map((entry, ei) => <EntryRow key={entry.version} entry={entry} ei={ei} />)
              : <div style={{ paddingLeft: 32, color: '#45455a', fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>No entries for this filter.</div>
            }
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0c0c14', textAlign: 'center' }}>
        <div className="cl-max" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, fontFamily: "'JetBrains Mono',monospace" }}>// beta access</div>
          <h2 style={{ fontSize: 'clamp(1.4rem,2.8vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 10 }}>Want early access?</h2>
          <p style={{ color: '#65657a', fontSize: '0.85rem', marginBottom: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>100 beta seats. Join the waitlist for launch-day access.</p>
          <a href="/sign-up" style={{
            display: 'inline-block', padding: '11px 28px', borderRadius: 8, background: '#7c3aed',
            color: '#fff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
            fontFamily: "'JetBrains Mono',monospace", transition: `opacity 0.2s ${E}`,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
          >join waitlist →</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 48px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="cl-footer-inner cl-max" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: '#7c3aed', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>P</div>
            <span style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>pulsar</span>
          </div>
          <div className="cl-footer-links" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['Home', '/'], ['Features', '/features'], ['Pricing', '/pricing'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: '0.7rem', color: '#45455a', transition: 'color 0.2s', fontFamily: "'JetBrains Mono',monospace" }}
                onMouseEnter={e => { e.currentTarget.style.color = '#65657a' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#45455a' }}
              >{l}</a>
            ))}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace" }}>© 2026 Pulsar</span>
        </div>
      </footer>
    </div>
  )
}
