'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LandingNav from '@/components/Landing/LandingNav'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, vis }
}

function useTyping(texts: string[], speed = 40, pause = 1600, delSpeed = 22) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const cur = texts[idx]
    let t: ReturnType<typeof setTimeout>
    if (!del && charIdx < cur.length) t = setTimeout(() => setCharIdx(c => c + 1), speed)
    else if (!del && charIdx === cur.length) t = setTimeout(() => setDel(true), pause)
    else if (del && charIdx > 0) t = setTimeout(() => setCharIdx(c => c - 1), delSpeed)
    else if (del && charIdx === 0) { setDel(false); setIdx(i => (i + 1) % texts.length) }
    setDisplay(cur.slice(0, charIdx))
    return () => clearTimeout(t)
  }, [charIdx, del, idx, texts, speed, pause, delSpeed])
  return display
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPING_WORDS = ['polymaths.', 'students.', 'researchers.', 'founders.', 'builders.', 'deep thinkers.']

const PILLARS = [
  { id: 'corespace',    icon: '⬡', name: 'Corespace',     tag: 'Command Center',       desc: 'Your personalized mission control. Drag-and-drop your entire workflow into one view. Every session starts here.',                          color: '#a78bfa' },
  { id: 'knowledge',   icon: '∞', name: 'Knowledge',     tag: 'Spatial Thinking',     desc: 'Detective-board connections on an infinite canvas. Think in webs, not folders. Every note is a live node with real context.',               color: '#818cf8' },
  { id: 'productivity',icon: '⚡', name: 'Productivity',  tag: 'Deep Work Engine',     desc: 'Tasks, goals, habits, and psychology-driven focus sessions with commitment mechanics. Flow state is a feature, not a side effect.',         color: '#6ee7b7' },
  { id: 'insights',    icon: '◈', name: 'Insights',      tag: 'Pattern Intelligence', desc: 'AI surfaces hidden patterns — focus distribution, streak trajectories, cognitive load scores, and balance forecasts.',                      color: '#fbbf24' },
  { id: 'customization',icon:'⬢', name: 'Customization', tag: 'Your Rules',           desc: 'Build custom note types, views, and automations without writing code. The system bends to you — never the other way around.',               color: '#f472b6' },
  { id: 'collaboration',icon:'◎', name: 'Collaboration', tag: 'Shared Minds',         desc: 'Real-time shared spaces with live presence, role-based permissions, and team knowledge synthesis that compounds over time.',                color: '#38bdf8' },
  { id: 'extensions',  icon: '⊕', name: 'Extensions',    tag: 'Infinite Reach',       desc: 'Plugin system with deep integrations — GitHub, Notion, Figma, Anki, and your own APIs. Connect Pulsar to everything you already use.',      color: '#f97316' },
]

const PROBLEMS = [
  { icon: '😴', title: 'Procrastination Loop',     desc: "Saving notes feels like progress. But without a path to action, you're just collecting — not building." },
  { icon: '🚨', title: 'Lost Context',             desc: 'Notes taken in the moment decay fast. By the time you return, the spark of insight is gone.' },
  { icon: '🧩', title: 'Tool Fragmentation',       desc: 'Notes in Notion. Tasks in Linear. Goals in a spreadsheet. Your brain bridges the gaps manually, constantly.' },
  { icon: '🧠', title: 'Cognitive Overload',       desc: 'You manually ask: "What does this mean? What do I do next? Where does this fit?" — every single time.' },
  { icon: '🤖', title: 'AI That Misses the Point', desc: "Current AI summarizes text. It doesn't connect your knowledge to your goals and move you forward." },
  { icon: '🕳️', title: 'The Execution Gap',        desc: "You have the insight. You know what to do. But no system converts that clarity into a scheduled, trackable action." },
]

const FEATURES = [
  { icon: '◈', label: 'Knowledge Graph',     desc: 'Connect every note to every idea',     color: '#818cf8' },
  { icon: '⚡', label: 'Deep Work Engine',    desc: 'Psychology-driven focus sessions',     color: '#6ee7b7' },
  { icon: '✦', label: 'AI Summaries',        desc: 'Auto-flashcards, auto-connections',    color: '#a78bfa' },
  { icon: '◎', label: 'Team Synthesis',      desc: 'Shared spaces with live presence',     color: '#38bdf8' },
  { icon: '⬢', label: 'Custom Automations',  desc: 'No-code. Your rules.',                 color: '#f472b6' },
  { icon: '⊕', label: '7+ Integrations',     desc: 'Slack, Anki, GitHub, TradingView',     color: '#f97316' },
]

const QUOTES = [
  { text: 'I cancelled Notion, Linear, Obsidian, and Todoist the same week. Pulsar absorbed all four.',              author: 'Kira V.',  role: 'Startup founder',   color: '#a78bfa' },
  { text: "The spatial canvas is exactly how my brain works. I've tried 12 PKM tools — this is the only one that stuck.", author: 'Dante R.', role: 'Research engineer', color: '#818cf8' },
  { text: 'The focus session commitment mechanics are no joke. I finished my thesis in 3 weeks using Pulsar.',        author: 'Maya L.',  role: 'CS grad student',   color: '#6ee7b7' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

@keyframes plFadeUp    { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
@keyframes plFloat     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes plBlink     { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes blobDrift   { 0% { transform: translate(0,0) } 50% { transform: translate(16px,-12px) } 100% { transform: translate(0,0) } }

.pl { --bg:#07070c; --s1:#0c0c14; --s2:#111119; --s3:#18182a; --s4:#222236;
  --bd:rgba(255,255,255,0.06); --bd2:rgba(255,255,255,0.1);
  --t1:#eeeef5; --t2:#a0a0b8; --t3:#65657a; --t4:#45455a;
  --ac:#a78bfa; --ac3:#7c3aed; --ok:#6ee7b7;
  --font:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
  font-family: var(--font); background: var(--bg); color: var(--t1);
  overflow-x: hidden; -webkit-font-smoothing: antialiased; line-height: 1.5 }
.pl * { margin: 0; padding: 0; box-sizing: border-box }
.pl ::-webkit-scrollbar { width: 4px }
.pl ::-webkit-scrollbar-track { background: transparent }
.pl ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.15); border-radius: 2px }
.pl a { color: var(--ac); text-decoration: none; transition: color 0.2s }
.pl a:hover { color: #c4b5fd }

.pl-max   { max-width: 1120px; margin: 0 auto }
.pl-sec   { padding: 96px 48px }
.pl-label { font-family: var(--mono); font-size: 0.68rem; font-weight: 600;
  color: var(--ac); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 12px }

@media (max-width: 768px) {
  .pl-sec { padding: 64px 20px !important }
  .pl-grid-2 { grid-template-columns: 1fr !important }
  .pl-grid-3 { grid-template-columns: 1fr !important }
  .pl-grid-4 { grid-template-columns: 1fr 1fr !important }
  .pl-hero-btns { flex-direction: column !important }
  .pl-stats-row { flex-direction: column !important; gap: 24px !important; align-items: flex-start !important }
  .pl-footer-inner { flex-direction: column !important; gap: 16px !important; text-align: center !important }
  .pl-footer-links { justify-content: center !important }
  .pl-mockup { display: none !important }
}
@media (max-width: 480px) {
  .pl-grid-4 { grid-template-columns: 1fr !important }
}
`

// ─── Sub-components ───────────────────────────────────────────────────────────

function Blob({ color, opacity, width, height, top, right, bottom, left, style }: {
  color: string; opacity: number; width: number; height: number;
  top?: string; right?: string; bottom?: string; left?: string; style?: React.CSSProperties
}) {
  return (
    <div aria-hidden style={{
      position: 'absolute', width, height, borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%',
      background: color, opacity, pointerEvents: 'none', zIndex: 0,
      top, right, bottom, left, animation: 'blobDrift 24s ease-in-out infinite',
      ...style,
    }} />
  )
}

function CorespaceMock() {
  const E = 'cubic-bezier(0.16,1,0.3,1)'
  return (
    <div style={{ background: '#07070c', borderRadius: 8, padding: 16, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.72rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { title: 'Active Projects', sub: '5 in progress · 2 blocked', color: '#a78bfa' },
          { title: 'Focus Today',     sub: '3h 47m · 4 sessions',       color: '#6ee7b7' },
          { title: 'Streak',          sub: '🔥 21 days · 847 pts',      color: '#fbbf24' },
          { title: 'Today',           sub: '6 tasks · 3 events',         color: '#38bdf8' },
        ].map((c, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.color}18` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#eeeef5', marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: '0.65rem', color: '#65657a' }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.6rem', color: '#45455a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>This week</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 36 }}>
          {[35, 70, 55, 85, 72, 60, 28].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: h > 60 ? '#a78bfa55' : '#a78bfa28', transition: `height 0.6s ${E} ${i * 0.05}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PillarCard({ pillar, delay }: { pillar: typeof PILLARS[0]; delay: number }) {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '20px', borderRadius: 10,
        border: `1px solid ${hov ? pillar.color + '30' : 'rgba(255,255,255,0.06)'}`,
        background: hov ? pillar.color + '06' : '#0c0c14',
        transition: `border-color 0.2s ${E}, background 0.2s ${E}`,
        cursor: 'default', animation: `plFadeUp 0.5s ${E} ${delay}s both`,
      }}
    >
      <div style={{ fontSize: '1.1rem', marginBottom: 10, color: pillar.color }}>{pillar.icon}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#eeeef5', marginBottom: 4, letterSpacing: '-0.01em', fontFamily: "'Inter',system-ui,sans-serif" }}>{pillar.name}</div>
      <div style={{ fontSize: '0.62rem', color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{pillar.tag}</div>
      <p style={{ fontSize: '0.75rem', color: '#65657a', lineHeight: 1.55, fontFamily: "'Inter',system-ui,sans-serif" }}>{pillar.desc}</p>
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="pl-footer-inner pl-max" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#7c3aed', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>pulsar</span>
        </div>
        <div className="pl-footer-links" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[['Home', '/'], ['Features', '/features'], ['Pricing', '/pricing'], ['Changelog', '/changelog'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: '0.7rem', color: '#45455a', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace", transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#65657a' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#45455a' }}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontSize: '0.68rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace" }}>© 2026 Pulsar</span>
      </div>
    </footer>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PulsarLandingProps { onEnter: () => void }

export default function PulsarLanding({ onEnter }: PulsarLandingProps) {
  const router = useRouter()
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const typedWord = useTyping(TYPING_WORDS)
  const [scrolled, setScrolled] = useState(false)
  const [betaSlots, setBetaSlots] = useState({ filled: 1, remaining: 99, total: 100 })

  const hero     = useReveal(0.04)
  const intro    = useReveal(0.07)
  const pillarsR = useReveal(0.05)
  const problemR = useReveal(0.07)
  const featR    = useReveal(0.06)
  const quotesR  = useReveal(0.07)
  const ctaR     = useReveal(0.08)

  useEffect(() => {
    const id = 'pl-styles'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id; s.textContent = STYLES; document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    fetch('/api/beta-count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBetaSlots(d) })
      .catch(() => {})
  }, [])

  return (
    <div className="pl">
      <LandingNav variant="fixed" scrolled={scrolled} onGetStarted={onEnter} />

      {/* ── Hero ── */}
      <section ref={hero.ref} className="pl-sec" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden',
        padding: '120px 48px 80px',
        opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(20px)',
        transition: `all 0.7s ${E}`,
      }}>
        <Blob color="#a78bfa" opacity={0.05} width={400} height={320} top="-80px" right="-60px" />
        <Blob color="#6ee7b7" opacity={0.04} width={300} height={240} bottom="-40px" left="-40px" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          <div className="pl-label" style={{ display: 'inline-block', marginBottom: 24 }}>// beta access open</div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 24,
            fontFamily: "'Inter',system-ui,sans-serif",
          }}>
            The workspace for<br />
            <span style={{ color: '#a78bfa' }}>{typedWord}</span>
            <span style={{ color: '#a78bfa', animation: 'plBlink 1s step-end infinite' }}>|</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.1rem)', color: '#a0a0b8', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 36px' }}>
            Pulsar connects your notes, tasks, goals, and AI into one workspace that moves you forward.
          </p>

          <div className="pl-hero-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onEnter} style={{
              padding: '12px 28px', borderRadius: 8, border: 'none', background: '#7c3aed',
              color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
            >join waitlist</button>
            <button onClick={() => router.push('/features')} style={{
              padding: '12px 28px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#a0a0b8', fontSize: '0.9rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; e.currentTarget.style.color = '#eeeef5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#a0a0b8' }}
            >see features →</button>
          </div>
        </div>

        {/* Hero product mockup */}
        <div className="pl-mockup" style={{
          position: 'relative', zIndex: 1, marginTop: 56, width: '100%', maxWidth: 900,
          animation: 'plFloat 5s ease-in-out infinite',
        }}>
          <div style={{
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            {/* Browser chrome */}
            <div style={{
              background: '#0c0c14', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444', '#fbbf24', '#22c55e'].map((c, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.5 }} />
                ))}
              </div>
              <div style={{
                flex: 1, background: '#111119', borderRadius: 4, padding: '4px 12px',
                fontSize: '0.65rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace",
                textAlign: 'center', maxWidth: 280, margin: '0 auto',
              }}>pulsar.zone/dashboard</div>
            </div>
            {/* Dashboard content */}
            <div style={{ background: '#07070c', padding: 20 }}>
              <CorespaceMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0c0c14' }}>
        <div className="pl-max pl-stats-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '32px 48px', gap: 32 }}>
          {[
            { val: '7',   label: 'core pillars' },
            { val: '100', label: 'beta seats total' },
            { val: '1',   label: 'workspace for it all' },
            { val: '0',   label: 'context switches' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eeeef5', fontFamily: "'Inter',system-ui,sans-serif", letterSpacing: '-0.03em' }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', color: '#65657a', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── What is Pulsar ── */}
      <section ref={intro.ref} className="pl-sec" style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        opacity: intro.vis ? 1 : 0, transform: intro.vis ? 'none' : 'translateY(20px)',
        transition: `all 0.7s ${E}`,
      }}>
        <div className="pl-max pl-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div className="pl-label">// what is pulsar</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
              A workspace that thinks with you.
            </h2>
            <p style={{ color: '#a0a0b8', lineHeight: 1.7, marginBottom: 16, fontSize: '0.95rem' }}>
              Most tools help you store information. Pulsar helps you act on it. Every note you write, every task you create, every goal you track — they're all connected, searchable, and linked to what matters.
            </p>
            <p style={{ color: '#65657a', lineHeight: 1.7, fontSize: '0.88rem' }}>
              Built for students, researchers, founders, and anyone who thinks deeply and needs a system that keeps up.
            </p>
          </div>
          <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#07070c', padding: '20px 24px', fontFamily: "'JetBrains Mono',monospace" }}>
            {[
              { label: '# Deep Learning Research', color: '#eeeef5', size: '0.82rem', weight: 600 },
              { label: '> 28 flashcards generated · linked to exam', color: '#6ee7b7', size: '0.72rem', weight: 400 },
              null,
              { label: '## Session notes', color: '#a0a0b8', size: '0.78rem', weight: 600 },
              { label: 'Transformer architecture → attention is O(n²)', color: '#65657a', size: '0.72rem', weight: 400 },
              { label: 'See: [[Systems Design]] · [[Math notes]]', color: '#a78bfa', size: '0.7rem', weight: 400 },
              null,
              { label: '⚡ Task: rewrite notes in own words', color: '#fbbf24', size: '0.72rem', weight: 400 },
              { label: '🎯 Goal: submit by Friday · 3 days left', color: '#f472b6', size: '0.72rem', weight: 400 },
            ].map((row, i) =>
              row === null
                ? <div key={i} style={{ height: 10 }} />
                : <div key={i} style={{ fontSize: row.size, fontWeight: row.weight, color: row.color, lineHeight: 1.6, marginBottom: 4 }}>{row.label}</div>
            )}
          </div>
        </div>
      </section>

      {/* ── 7 Pillars ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={pillarsR.ref} style={{ opacity: pillarsR.vis ? 1 : 0, transform: pillarsR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label">// the 7 pillars</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 8 }}>
            Seven systems. One workspace.
          </h2>
          <p style={{ color: '#65657a', fontSize: '0.88rem', marginBottom: 48 }}>Each pillar is a fully realized module — not a feature checklist.</p>
          <div className="pl-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            {PILLARS.slice(0, 4).map((p, i) => <PillarCard key={p.id} pillar={p} delay={i * 0.05} />)}
          </div>
          <div className="pl-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {PILLARS.slice(4).map((p, i) => <PillarCard key={p.id} pillar={p} delay={(i + 4) * 0.05} />)}
            <div />
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="pl-sec" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
        <Blob color="#fbbf24" opacity={0.03} width={360} height={280} top="-60px" left="-60px" />
        <div className="pl-max" ref={problemR.ref} style={{ position: 'relative', zIndex: 1, opacity: problemR.vis ? 1 : 0, transform: problemR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pl-label" style={{ display: 'inline-block' }}>// the problem</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginTop: 4 }}>
              Why existing tools keep failing you.
            </h2>
          </div>
          <div className="pl-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                background: '#07070c', transition: `border-color 0.2s ${E}, transform 0.2s ${E}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#eeeef5', marginBottom: 8, letterSpacing: '-0.01em' }}>{p.title}</div>
                <p style={{ fontSize: '0.8rem', color: '#65657a', lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature centerpiece ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={featR.ref} style={{ opacity: featR.vis ? 1 : 0, transform: featR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label">// built different</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 48 }}>
            Built for the way you actually think.
          </h2>
          {/* Knowledge graph centerpiece */}
          <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: '#0c0c14', padding: '32px', marginBottom: 14, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: 600, height: 'auto' }}>
              {[
                { x: 100, y: 100, r: 14, c: '#a78bfa', label: 'Deep Learning' },
                { x: 240, y: 50,  r: 11, c: '#818cf8', label: 'Math Notes' },
                { x: 360, y: 110, r: 13, c: '#6ee7b7', label: 'Research Paper' },
                { x: 200, y: 155, r: 10, c: '#fbbf24', label: 'Exam Prep' },
                { x: 470, y: 60,  r: 10, c: '#f472b6', label: 'Systems Design' },
                { x: 490, y: 150, r: 9,  c: '#38bdf8', label: 'Project Goals' },
              ].reduce((acc, n, i, arr) => {
                arr.forEach((m, j) => {
                  if (j > i) {
                    const dx = n.x - m.x, dy = n.y - m.y
                    const d = Math.sqrt(dx * dx + dy * dy)
                    if (d < 200) acc.push(
                      <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                        stroke={n.c} strokeWidth="0.8" opacity="0.25" strokeDasharray="4 4" />
                    )
                  }
                })
                return acc
              }, [] as React.ReactElement[])}
              {[
                { x: 100, y: 100, r: 14, c: '#a78bfa', label: 'Deep Learning' },
                { x: 240, y: 50,  r: 11, c: '#818cf8', label: 'Math Notes' },
                { x: 360, y: 110, r: 13, c: '#6ee7b7', label: 'Research Paper' },
                { x: 200, y: 155, r: 10, c: '#fbbf24', label: 'Exam Prep' },
                { x: 470, y: 60,  r: 10, c: '#f472b6', label: 'Systems Design' },
                { x: 490, y: 150, r: 9,  c: '#38bdf8', label: 'Project Goals' },
              ].map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity={0.8} />
                  <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fill={n.c} fontSize="9" opacity={0.7} fontFamily="JetBrains Mono, monospace">{n.label}</text>
                </g>
              ))}
            </svg>
            <div style={{ fontSize: '0.68rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace", marginTop: 8 }}>Knowledge Pillar — spatial thinking at scale</div>
          </div>
          {/* Feature icon grid */}
          <div className="pl-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: '20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                background: '#0c0c14', transition: `border-color 0.2s ${E}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: 10, color: f.color }}>{f.icon}</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#eeeef5', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#65657a' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="pl-sec" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={quotesR.ref} style={{ opacity: quotesR.vis ? 1 : 0, transform: quotesR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pl-label" style={{ display: 'inline-block' }}>// early users</div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginTop: 4 }}>
              People who switched.
            </h2>
          </div>
          <div className="pl-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {QUOTES.map((q, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                background: '#07070c', display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <p style={{ fontSize: '0.83rem', color: '#a0a0b8', lineHeight: 1.7, flex: 1 }}>"{q.text}"</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: q.color + '20', border: `1px solid ${q.color}30`, display: 'grid', placeItems: 'center', fontSize: '0.72rem', fontWeight: 700, color: q.color, flexShrink: 0 }}>
                    {q.author[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#eeeef5' }}>{q.author}</div>
                    <div style={{ fontSize: '0.7rem', color: '#45455a', marginTop: 1, fontFamily: "'JetBrains Mono',monospace" }}>{q.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Blob color="#a78bfa" opacity={0.06} width={500} height={400} top="50%" left="50%" style={{ transform: 'translate(-50%,-50%)' }} />
        <div className="pl-max" ref={ctaR.ref} style={{ position: 'relative', zIndex: 1, opacity: ctaR.vis ? 1 : 0, transform: ctaR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label" style={{ display: 'inline-block' }}>// beta access</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, margin: '8px auto 12px', maxWidth: 560 }}>
            Join 100 builders shaping what's next.
          </h2>
          <p style={{ color: '#65657a', fontSize: '0.9rem', marginBottom: 32 }}>
            Start free. No credit card required. {betaSlots.remaining} beta seats remaining.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ width: 180, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ width: `${(betaSlots.filled / betaSlots.total) * 100}%`, height: '100%', borderRadius: 2, background: '#7c3aed', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{betaSlots.filled}/{betaSlots.total} claimed</span>
          </div>
          <button onClick={onEnter} style={{
            padding: '13px 36px', borderRadius: 8, border: 'none', background: '#7c3aed',
            color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
          >join waitlist →</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
