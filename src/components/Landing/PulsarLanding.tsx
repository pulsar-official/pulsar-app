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

function useTyping(texts: string[], speed = 42, pause = 1800, delSpeed = 20) {
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

function useCounter(target: number, duration = 1200) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!started || target === 0) { setCount(target); return }
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])
  return { ref, count }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPING_WORDS = ['polymaths.', 'students.', 'researchers.', 'founders.', 'builders.', 'deep thinkers.']

const PILLARS = [
  { id: 'corespace',     icon: '⬡', name: 'Corespace',      tag: 'Command Center',       desc: 'Your personalized mission control. Drag-and-drop your entire workflow into one view. Every session starts here.',                     color: '#a78bfa' },
  { id: 'knowledge',    icon: '∞', name: 'Knowledge',      tag: 'Spatial Thinking',     desc: 'Detective-board connections on an infinite canvas. Think in webs, not folders. Every note is a live node with real context.',          color: '#818cf8' },
  { id: 'productivity', icon: '⚡', name: 'Productivity',   tag: 'Deep Work Engine',     desc: 'Tasks, goals, habits, and psychology-driven focus sessions with commitment mechanics. Flow state is a feature, not a side effect.',    color: '#6ee7b7' },
  { id: 'insights',     icon: '◈', name: 'Insights',       tag: 'Pattern Intelligence', desc: 'AI surfaces hidden patterns — focus distribution, streak trajectories, cognitive load scores, and balance forecasts.',               color: '#fbbf24' },
  { id: 'customization',icon: '⬢', name: 'Customization',  tag: 'Your Rules',           desc: 'Build custom note types, views, and automations without writing code. The system bends to you — never the other way around.',          color: '#f472b6' },
  { id: 'collaboration',icon: '◎', name: 'Collaboration',  tag: 'Shared Minds',         desc: 'Real-time shared spaces with live presence, role-based permissions, and team knowledge synthesis that compounds over time.',          color: '#38bdf8' },
  { id: 'extensions',   icon: '⊕', name: 'Extensions',     tag: 'Infinite Reach',       desc: 'Plugin system with deep integrations — GitHub, Notion, Figma, Anki, and your own APIs. Connect Pulsar to everything you already use.', color: '#f97316' },
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
  { icon: '◈', label: 'Knowledge Graph',    desc: 'Connect every note to every idea',    color: '#818cf8' },
  { icon: '⚡', label: 'Deep Work Engine',   desc: 'Psychology-driven focus sessions',    color: '#6ee7b7' },
  { icon: '✦', label: 'AI Summaries',       desc: 'Auto-flashcards, auto-connections',   color: '#a78bfa' },
  { icon: '◎', label: 'Team Synthesis',     desc: 'Shared spaces with live presence',    color: '#38bdf8' },
  { icon: '⬢', label: 'Custom Automations', desc: 'No-code. Your rules.',                color: '#f472b6' },
  { icon: '⊕', label: '7+ Integrations',    desc: 'Slack, Anki, GitHub, TradingView',    color: '#f97316' },
]

const QUOTES = [
  { text: 'I cancelled Notion, Linear, Obsidian, and Todoist the same week. Pulsar absorbed all four.',              author: 'Kira V.',  role: 'Startup founder',   color: '#a78bfa' },
  { text: "The spatial canvas is exactly how my brain works. I've tried 12 PKM tools — this is the only one that stuck.", author: 'Dante R.', role: 'Research engineer', color: '#818cf8' },
  { text: 'The focus session commitment mechanics are no joke. I finished my thesis in 3 weeks using Pulsar.',        author: 'Maya L.',  role: 'CS grad student',   color: '#6ee7b7' },
]

const STACK = [
  { tool: 'Notion',          what: 'Notes & wikis',    icon: '📄', color: '#a0a0b8' },
  { tool: 'Linear / Jira',   what: 'Task tracking',    icon: '✅', color: '#818cf8' },
  { tool: 'Obsidian',        what: 'Knowledge graph',  icon: '🕸️', color: '#a78bfa' },
  { tool: 'Todoist',         what: 'Daily tasks',      icon: '📋', color: '#6ee7b7' },
  { tool: 'Google Calendar', what: 'Scheduling',       icon: '📅', color: '#38bdf8' },
  { tool: 'Anki',            what: 'Flashcards',       icon: '🃏', color: '#fbbf24' },
  { tool: 'Focusmate',       what: 'Focus sessions',   icon: '⏱️', color: '#f472b6' },
  { tool: 'Miro / FigJam',   what: 'Visual thinking',  icon: '🗺️', color: '#f97316' },
]

const HOW_STEPS = [
  { num: '01', title: 'CAPTURE', sub: 'Everything goes in.', desc: 'Notes, tasks, goals, events — one shortcut from anywhere. Nothing falls through the cracks. Nothing needs its own app.', color: '#a78bfa' },
  { num: '02', title: 'CONNECT', sub: 'Pulsar links it all.', desc: 'AI surfaces relationships between your notes, goals, and tasks automatically. Your knowledge graph builds itself.', color: '#6ee7b7' },
  { num: '03', title: 'ACT',     sub: 'Move forward with clarity.', desc: 'Every insight becomes a task. Every task has a deadline. Every session has a purpose. Pulsar closes the execution gap.', color: '#fbbf24' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

@keyframes plFadeUp    { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
@keyframes plFadeLeft  { from { opacity:0; transform:translateX(-24px) } to { opacity:1; transform:translateX(0) } }
@keyframes plFadeRight { from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
@keyframes plScaleIn   { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
@keyframes plFloat     { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
@keyframes plBlink     { 0%,100% { opacity:1 } 50% { opacity:0 } }
@keyframes blobDrift   { 0% { transform:translate(0,0) } 50% { transform:translate(16px,-12px) } 100% { transform:translate(0,0) } }
@keyframes plPulse     { 0%,100% { box-shadow:0 0 0 0 rgba(124,58,237,0.5) } 50% { box-shadow:0 0 0 10px rgba(124,58,237,0) } }
@keyframes plSpin      { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }

.pl { --bg:#07070c; --s1:#0c0c14; --s2:#111119; --s3:#18182a; --s4:#222236;
  --bd:rgba(255,255,255,0.06); --bd2:rgba(255,255,255,0.1);
  --t1:#eeeef5; --t2:#a0a0b8; --t3:#65657a; --t4:#45455a;
  --ac:#a78bfa; --ac3:#7c3aed; --ok:#6ee7b7;
  --font:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
  font-family:var(--font); background:var(--bg); color:var(--t1);
  overflow-x:hidden; -webkit-font-smoothing:antialiased; line-height:1.5 }
.pl * { margin:0; padding:0; box-sizing:border-box }
.pl ::-webkit-scrollbar { width:4px }
.pl ::-webkit-scrollbar-track { background:transparent }
.pl ::-webkit-scrollbar-thumb { background:rgba(167,139,250,0.15); border-radius:2px }

.pl-max  { max-width:1120px; margin:0 auto }
.pl-sec  { padding:96px 48px }

.pl-label {
  font-family:var(--mono); font-size:0.62rem; font-weight:700;
  color:var(--ac); text-transform:uppercase; letter-spacing:0.2em;
  margin-bottom:16px; display:flex; align-items:center; gap:10px
}
.pl-label::before {
  content:''; display:inline-block; width:20px; height:1px;
  background:var(--ac); opacity:0.5; flex-shrink:0
}

@media (max-width:900px) {
  .pl-hero-grid { grid-template-columns:1fr !important }
  .pl-mockup-col { display:none !important }
}
@media (max-width:768px) {
  .pl-sec { padding:64px 20px !important }
  .pl-grid-2 { grid-template-columns:1fr !important }
  .pl-grid-3 { grid-template-columns:1fr !important }
  .pl-grid-4 { grid-template-columns:1fr 1fr !important }
  .pl-hero-btns { flex-direction:column !important }
  .pl-stats-inner { flex-direction:column !important; gap:24px !important; align-items:flex-start !important }
  .pl-footer-inner { flex-direction:column !important; gap:16px !important; text-align:center !important }
  .pl-footer-links { justify-content:center !important }
  .pl-how-grid { flex-direction:column !important }
  .pl-how-sep { display:none !important }
}
@media (max-width:480px) {
  .pl-grid-4 { grid-template-columns:1fr !important }
}
`

// ─── Sub-components ───────────────────────────────────────────────────────────

function Blob({ color, opacity, width, height, top, right, bottom, left, style }: {
  color: string; opacity: number; width: number; height: number
  top?: string; right?: string; bottom?: string; left?: string; style?: React.CSSProperties
}) {
  return (
    <div aria-hidden style={{
      position: 'absolute', width, height,
      borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%',
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
        <div style={{ fontSize: '0.6rem', color: '#45455a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>This week</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
          {[35, 70, 55, 85, 72, 60, 28].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0',
              background: h > 60 ? '#a78bfa66' : '#a78bfa28',
              transition: `height 0.6s ${E} ${i * 0.05}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PillarCard({ pillar, vis, delay }: { pillar: typeof PILLARS[0]; vis: boolean; delay: number }) {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '20px', borderRadius: 10,
        border: `1px solid ${hov ? pillar.color + '35' : 'rgba(255,255,255,0.06)'}`,
        background: hov ? pillar.color + '08' : '#07070c',
        transition: `all 0.25s ${E}`,
        transform: hov ? 'translateY(-3px)' : vis ? 'none' : 'translateY(20px)',
        opacity: vis ? 1 : 0,
        transitionDelay: vis ? `${delay}s` : '0s',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: '1.1rem', marginBottom: 10, color: pillar.color }}>{pillar.icon}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#eeeef5', marginBottom: 4, letterSpacing: '-0.01em' }}>{pillar.name}</div>
      <div style={{ fontSize: '0.6rem', color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{pillar.tag}</div>
      <p style={{ fontSize: '0.75rem', color: '#65657a', lineHeight: 1.6 }}>{pillar.desc}</p>
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

  // counters
  const cPillars  = useCounter(7,   1000)
  const cSeats    = useCounter(100, 1400)
  const cTools    = useCounter(8,   1100)
  const cSwitches = useCounter(0,   400)

  // section reveals
  const heroR     = useReveal(0.04)
  const introR    = useReveal(0.07)
  const howR      = useReveal(0.06)
  const problemR  = useReveal(0.06)
  const pillarsR  = useReveal(0.05)
  const stackR    = useReveal(0.07)
  const featR     = useReveal(0.06)
  const quotesR   = useReveal(0.07)
  const ctaR      = useReveal(0.08)

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

      {/* ── HERO — left text, right mockup ── */}
      <section className="pl-sec" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        paddingTop: 120, paddingBottom: 80,
      }}>
        <Blob color="#a78bfa" opacity={0.05} width={500} height={400} top="-80px" right="-80px" />
        <Blob color="#6ee7b7" opacity={0.03} width={300} height={240} bottom="-60px" left="-60px" />

        <div className="pl-max pl-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center', width: '100%' }}>

          {/* LEFT: text */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="pl-label" style={{
              opacity: heroR.vis ? 1 : 0,
              transform: heroR.vis ? 'none' : 'translateY(12px)',
              transition: `all 0.5s ${E} 0.05s`,
            }}>Beta Access Open</div>

            <h1 style={{
              fontSize: 'clamp(2.6rem, 4.5vw, 4.2rem)', fontWeight: 800,
              letterSpacing: '-0.04em', lineHeight: 1.06, marginBottom: 20,
              opacity: heroR.vis ? 1 : 0,
              transform: heroR.vis ? 'none' : 'translateY(20px)',
              transition: `all 0.65s ${E} 0.15s`,
            }}>
              The workspace<br />
              for{' '}
              <span style={{ color: '#a78bfa' }}>{typedWord}</span>
              <span style={{ color: '#a78bfa', animation: 'plBlink 1s step-end infinite' }}>|</span>
            </h1>

            <p style={{
              fontSize: '1rem', color: '#a0a0b8', lineHeight: 1.72, maxWidth: 460, marginBottom: 36,
              opacity: heroR.vis ? 1 : 0,
              transform: heroR.vis ? 'none' : 'translateY(16px)',
              transition: `all 0.6s ${E} 0.3s`,
            }}>
              Pulsar connects your notes, tasks, goals, and AI into one workspace that moves you forward.
              Stop context-switching. Start building.
            </p>

            <div className="pl-hero-btns" ref={heroR.ref} style={{
              display: 'flex', gap: 12, flexWrap: 'wrap',
              opacity: heroR.vis ? 1 : 0,
              transform: heroR.vis ? 'none' : 'translateY(12px)',
              transition: `all 0.5s ${E} 0.45s`,
            }}>
              <button onClick={onEnter} style={{
                padding: '13px 30px', borderRadius: 8, border: 'none', background: '#7c3aed',
                color: '#fff', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em',
                transition: `all 0.2s ${E}`, animation: 'plPulse 3s ease-in-out 2s infinite',
                textTransform: 'uppercase',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
              >Join Waitlist</button>
              <button onClick={() => router.push('/features')} style={{
                padding: '13px 28px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: '#a0a0b8', fontSize: '0.86rem', fontWeight: 500,
                cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; e.currentTarget.style.color = '#eeeef5' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#a0a0b8' }}
              >See features →</button>
            </div>

            {/* Social proof micro */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 32,
              opacity: heroR.vis ? 1 : 0, transition: `all 0.5s ${E} 0.6s`,
            }}>
              <div style={{ display: 'flex' }}>
                {[{ c: '#a78bfa', l: 'K' }, { c: '#818cf8', l: 'D' }, { c: '#6ee7b7', l: 'M' }].map((a, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: a.c + '25', border: `1.5px solid ${a.c}45`,
                    display: 'grid', placeItems: 'center', fontSize: '0.62rem',
                    fontWeight: 700, color: a.c, marginLeft: i > 0 ? -7 : 0,
                    flexShrink: 0,
                  }}>{a.l}</div>
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace" }}>
                Joined by founders, researchers &amp; students
              </span>
            </div>
          </div>

          {/* RIGHT: product mockup */}
          <div className="pl-mockup-col" style={{
            position: 'relative', zIndex: 1,
            opacity: heroR.vis ? 1 : 0,
            transform: heroR.vis ? 'none' : 'translateX(28px)',
            transition: `all 0.8s ${E} 0.25s`,
          }}>
            <div style={{ animation: 'plFloat 5s ease-in-out infinite' }}>
              <div style={{
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.05)',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: '#0c0c14', paddingTop: 10, paddingBottom: 10,
                  paddingLeft: 16, paddingRight: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#ef4444', '#fbbf24', '#22c55e'].map((c, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.5 }} />
                    ))}
                  </div>
                  <div style={{
                    flex: 1, background: '#111119', borderRadius: 4,
                    paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12,
                    fontSize: '0.62rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace",
                    textAlign: 'center', maxWidth: 240, margin: '0 auto',
                  }}>pulsar.zone/dashboard</div>
                </div>
                <div style={{ background: '#07070c', padding: 20 }}>
                  <CorespaceMock />
                </div>
              </div>
            </div>
            {/* Glow */}
            <div aria-hidden style={{
              position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)',
              width: '60%', height: 60,
              background: 'radial-gradient(ellipse,rgba(124,58,237,0.2) 0%,transparent 70%)',
              pointerEvents: 'none', filter: 'blur(24px)',
            }} />
          </div>
        </div>
      </section>

      {/* ── STATS BAR — counter animation ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0c0c14' }}>
        <div className="pl-max pl-stats-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '36px 48px', gap: 32 }}>
          <div ref={cPillars.ref} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#eeeef5', letterSpacing: '-0.05em', lineHeight: 1 }}>{cPillars.count}</div>
            <div style={{ fontSize: '0.6rem', color: '#45455a', marginTop: 7, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.16em', textTransform: 'uppercase' }}>Core Pillars</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
          <div ref={cSeats.ref} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#eeeef5', letterSpacing: '-0.05em', lineHeight: 1 }}>{cSeats.count}</div>
            <div style={{ fontSize: '0.6rem', color: '#45455a', marginTop: 7, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.16em', textTransform: 'uppercase' }}>Beta Seats</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
          <div ref={cTools.ref} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#6ee7b7', letterSpacing: '-0.05em', lineHeight: 1 }}>{cTools.count}+</div>
            <div style={{ fontSize: '0.6rem', color: '#45455a', marginTop: 7, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tools Replaced</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
          <div ref={cSwitches.ref} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#eeeef5', letterSpacing: '-0.05em', lineHeight: 1 }}>{cSwitches.count}</div>
            <div style={{ fontSize: '0.6rem', color: '#45455a', marginTop: 7, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.16em', textTransform: 'uppercase' }}>Context Switches</div>
          </div>
        </div>
      </div>

      {/* ── WHAT IS PULSAR ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div ref={introR.ref} className="pl-max pl-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div style={{
            opacity: introR.vis ? 1 : 0,
            transform: introR.vis ? 'none' : 'translateX(-20px)',
            transition: `all 0.7s ${E}`,
          }}>
            <div className="pl-label">What is Pulsar</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.3rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 18 }}>
              A workspace that<br />thinks with you.
            </h2>
            <p style={{ color: '#a0a0b8', lineHeight: 1.75, marginBottom: 16, fontSize: '0.95rem' }}>
              Most tools help you store information. Pulsar helps you{' '}
              <span style={{ color: '#eeeef5', fontWeight: 600 }}>act on it</span>.
              Every note, task, and goal — connected, searchable, and linked to what matters.
            </p>
            <p style={{ color: '#65657a', lineHeight: 1.7, fontSize: '0.88rem' }}>
              Built for students, researchers, founders, and anyone who thinks deeply and needs a system that keeps up.
            </p>
          </div>
          <div style={{
            borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
            background: '#07070c', padding: '20px 24px',
            fontFamily: "'JetBrains Mono',monospace",
            opacity: introR.vis ? 1 : 0,
            transform: introR.vis ? 'none' : 'translateX(20px)',
            transition: `all 0.7s ${E} 0.1s`,
          }}>
            {([
              { label: '# Deep Learning Research', color: '#eeeef5', size: '0.82rem', weight: 600 },
              { label: '> 28 flashcards generated · linked to exam', color: '#6ee7b7', size: '0.72rem', weight: 400 },
              null,
              { label: '## Session notes', color: '#a0a0b8', size: '0.78rem', weight: 600 },
              { label: 'Transformer architecture → attention is O(n²)', color: '#65657a', size: '0.72rem', weight: 400 },
              { label: 'See: [[Systems Design]] · [[Math notes]]', color: '#a78bfa', size: '0.7rem', weight: 400 },
              null,
              { label: '⚡ Task: rewrite notes in own words', color: '#fbbf24', size: '0.72rem', weight: 400 },
              { label: '🎯 Goal: submit by Friday · 3 days left', color: '#f472b6', size: '0.72rem', weight: 400 },
            ] as (null | { label: string; color: string; size: string; weight: number })[]).map((row, i) =>
              row === null
                ? <div key={i} style={{ height: 10 }} />
                : <div key={i} style={{ fontSize: row.size, fontWeight: row.weight, color: row.color, lineHeight: 1.65, marginBottom: 4 }}>{row.label}</div>
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — 3 steps ── */}
      <section className="pl-sec" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
        <Blob color="#818cf8" opacity={0.03} width={400} height={300} bottom="-60px" right="-60px" />
        <div ref={howR.ref} className="pl-max" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="pl-label" style={{ justifyContent: 'center' }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Three steps. One system.
            </h2>
          </div>
          <div className="pl-how-grid" style={{ display: 'flex', alignItems: 'flex-start' }}>
            {HOW_STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{
                  flex: 1, padding: '0 24px',
                  opacity: howR.vis ? 1 : 0,
                  transform: howR.vis ? 'none' : 'translateY(20px)',
                  transition: `all 0.6s ${E} ${0.05 + i * 0.15}s`,
                }}>
                  <div style={{ fontSize: '0.58rem', color: step.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: '0.22em', marginBottom: 14, opacity: 0.6 }}>{step.num}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: step.color + '12', border: `1px solid ${step.color}25`, display: 'grid', placeItems: 'center', fontSize: '1rem', flexShrink: 0 }}>
                      {['⚡', '🔗', '🎯'][i]}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#eeeef5', letterSpacing: '-0.03em' }}>{step.title}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: step.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 14, fontWeight: 500 }}>{step.sub}</div>
                  <div style={{ width: 28, height: 2, background: step.color, opacity: 0.35, borderRadius: 1, marginBottom: 16 }} />
                  <p style={{ fontSize: '0.82rem', color: '#65657a', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
                {i < HOW_STEPS.length - 1 && (
                  <div className="pl-how-sep" style={{
                    display: 'flex', alignItems: 'center', paddingTop: 60, color: '#222236', fontSize: '1.4rem', flexShrink: 0,
                    opacity: howR.vis ? 1 : 0, transition: `all 0.5s ${E} ${0.3 + i * 0.1}s`,
                  }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
        <Blob color="#fbbf24" opacity={0.03} width={360} height={280} top="-60px" left="-60px" />
        <div className="pl-max" ref={problemR.ref} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 48 }}>
            <div className="pl-label">The Problem</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Why existing tools keep failing you.
            </h2>
          </div>
          <div className="pl-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                background: '#0c0c14',
                opacity: problemR.vis ? 1 : 0,
                transform: problemR.vis ? 'none' : 'translateY(16px)',
                transition: `all 0.5s ${E} ${i * 0.07}s`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 14 }}>{p.icon}</div>
                <div style={{ fontSize: '0.87rem', fontWeight: 700, color: '#eeeef5', marginBottom: 8, letterSpacing: '-0.01em' }}>{p.title}</div>
                <p style={{ fontSize: '0.78rem', color: '#65657a', lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE 7 PILLARS ── */}
      <section className="pl-sec" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={pillarsR.ref}>
          <div className="pl-label">The 7 Pillars</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 8 }}>
            Seven systems. One workspace.
          </h2>
          <p style={{ color: '#65657a', fontSize: '0.88rem', marginBottom: 48 }}>Each pillar is a fully realized module — not a feature checklist.</p>
          <div className="pl-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            {PILLARS.slice(0, 4).map((p, i) => <PillarCard key={p.id} pillar={p} vis={pillarsR.vis} delay={i * 0.08} />)}
          </div>
          <div className="pl-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {PILLARS.slice(4).map((p, i) => <PillarCard key={p.id} pillar={p} vis={pillarsR.vis} delay={(i + 4) * 0.08} />)}
            <div />
          </div>
        </div>
      </section>

      {/* ── REPLACE YOUR STACK ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div ref={stackR.ref} className="pl-max pl-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div style={{
            opacity: stackR.vis ? 1 : 0,
            transform: stackR.vis ? 'none' : 'translateX(-20px)',
            transition: `all 0.7s ${E}`,
          }}>
            <div className="pl-label">Replace Your Stack</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
              One subscription.<br />Replace them all.
            </h2>
            <p style={{ color: '#a0a0b8', fontSize: '0.92rem', lineHeight: 1.72, marginBottom: 28 }}>
              The average knowledge worker pays for 6+ tools that don't talk to each other.
              Pulsar absorbs your entire stack and actually connects the pieces.
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 18px',
              borderRadius: 8, background: '#0c0c14', border: '1px solid rgba(110,231,183,0.15)',
            }}>
              <span style={{ fontSize: '0.62rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Avg savings</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6ee7b7', letterSpacing: '-0.04em' }}>$47/mo</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {STACK.map((item, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)', background: '#0c0c14',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: stackR.vis ? 1 : 0,
                transform: stackR.vis ? 'none' : 'scale(0.95)',
                transition: `all 0.45s ${E} ${i * 0.05}s`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + '28'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none' }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#eeeef5', lineHeight: 1.2 }}>{item.tool}</div>
                  <div style={{ fontSize: '0.62rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{item.what}</div>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#6ee7b7' + '15', border: '1px solid #6ee7b730',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <svg width="8" height="8" viewBox="0 0 10 10"><polyline points="2,5 4.5,7.5 8,3" stroke="#6ee7b7" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE CENTERPIECE ── */}
      <section className="pl-sec" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={featR.ref} style={{ opacity: featR.vis ? 1 : 0, transform: featR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label">Built Different</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 48 }}>
            Built for the way you actually think.
          </h2>

          {/* Knowledge graph SVG */}
          <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: '#07070c', padding: '32px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: 600, height: 'auto', display: 'block', margin: '0 auto' }}>
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
                    if (Math.sqrt(dx * dx + dy * dy) < 200)
                      acc.push(<line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke={n.c} strokeWidth="0.8" opacity="0.22" strokeDasharray="4 4" />)
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
                  <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity={0.85} />
                  <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fill={n.c} fontSize="9" opacity={0.65} fontFamily="JetBrains Mono,monospace">{n.label}</text>
                </g>
              ))}
            </svg>
            <div style={{ fontSize: '0.62rem', color: '#45455a', fontFamily: "'JetBrains Mono',monospace", marginTop: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Knowledge Pillar — spatial thinking at scale</div>
          </div>

          <div className="pl-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: '20px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)', background: '#07070c',
                opacity: featR.vis ? 1 : 0,
                transform: featR.vis ? 'none' : 'translateY(12px)',
                transition: `all 0.45s ${E} ${0.3 + i * 0.07}s`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '30'; e.currentTarget.style.background = f.color + '07' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#07070c' }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: 10, color: f.color }}>{f.icon}</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#eeeef5', marginBottom: 4, letterSpacing: '-0.01em' }}>{f.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#65657a' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="pl-sec" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={quotesR.ref} style={{ opacity: quotesR.vis ? 1 : 0, transform: quotesR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pl-label" style={{ justifyContent: 'center' }}>Early Users</div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              People who switched.
            </h2>
          </div>
          <div className="pl-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {QUOTES.map((q, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)', background: '#0c0c14',
                display: 'flex', flexDirection: 'column', gap: 16,
                opacity: quotesR.vis ? 1 : 0,
                transform: quotesR.vis ? 'none' : 'translateY(16px)',
                transition: `all 0.5s ${E} ${i * 0.1}s`,
              }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="10" height="10" viewBox="0 0 10 10">
                      <polygon points="5,1 6.2,3.8 9.5,3.8 7,5.8 7.9,9 5,7.2 2.1,9 3,5.8 0.5,3.8 3.8,3.8" fill="#fbbf24" opacity="0.75" />
                    </svg>
                  ))}
                </div>
                <p style={{ fontSize: '0.83rem', color: '#a0a0b8', lineHeight: 1.72, flex: 1 }}>"{q.text}"</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: q.color + '20', border: `1px solid ${q.color}35`, display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: q.color, flexShrink: 0 }}>
                    {q.author[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#eeeef5' }}>{q.author}</div>
                    <div style={{ fontSize: '0.68rem', color: '#45455a', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{q.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pl-sec" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Blob color="#a78bfa" opacity={0.06} width={600} height={480} top="50%" left="50%" style={{ transform: 'translate(-50%,-50%)' }} />
        <div ref={ctaR.ref} className="pl-max" style={{ position: 'relative', zIndex: 1, opacity: ctaR.vis ? 1 : 0, transform: ctaR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label" style={{ justifyContent: 'center' }}>Beta Access</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '8px auto 14px', maxWidth: 580 }}>
            Join 100 builders<br />shaping what's next.
          </h2>
          <p style={{ color: '#65657a', fontSize: '0.9rem', marginBottom: 36, lineHeight: 1.6 }}>
            Start free. No credit card.{' '}
            <span style={{ color: '#a78bfa', fontWeight: 500 }}>{betaSlots.remaining} beta seats remaining.</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ width: 200, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ width: `${(betaSlots.filled / betaSlots.total) * 100}%`, height: '100%', borderRadius: 2, background: '#7c3aed', transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <span style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{betaSlots.filled}/{betaSlots.total} claimed</span>
          </div>
          <button onClick={onEnter} style={{
            padding: '14px 44px', borderRadius: 8, border: 'none', background: '#7c3aed',
            color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em',
            transition: `all 0.2s ${E}`, textTransform: 'uppercase',
            animation: 'plPulse 3s ease-in-out 1s infinite',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
          >Join Waitlist →</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
