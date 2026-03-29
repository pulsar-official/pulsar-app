'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LandingNav from '@/components/Landing/LandingNav'

// ─── Hooks ─────────────────────────────────────────────────────────────────────

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

// ─── Data ───────────────────────────────────────────────────────────────────────

const PILLARS = [
  { icon: '⬡', name: 'Corespace',     tag: 'Command Center',       desc: 'Your personalized mission control. Every session starts here.',           color: '#a78bfa' },
  { icon: '∞', name: 'Knowledge',     tag: 'Spatial Thinking',     desc: 'Detective-board connections on an infinite canvas. Think in webs.',        color: '#818cf8' },
  { icon: '⚡', name: 'Productivity',  tag: 'Deep Work Engine',     desc: 'Tasks, goals, habits, and psychology-driven focus sessions.',              color: '#6ee7b7' },
  { icon: '◈', name: 'Insights',      tag: 'Pattern Intelligence', desc: 'AI surfaces hidden patterns — focus distribution, streak trajectories.',   color: '#fbbf24' },
  { icon: '⬢', name: 'Customization', tag: 'Your Rules',           desc: 'Custom note types, views, and automations — no code required.',           color: '#f472b6' },
  { icon: '◎', name: 'Collaboration', tag: 'Shared Minds',         desc: 'Real-time shared spaces with live presence and role-based permissions.',   color: '#38bdf8' },
  { icon: '⊕', name: 'Extensions',   tag: 'Infinite Reach',       desc: 'Deep integrations — GitHub, Figma, Anki, and your own APIs.',             color: '#f97316' },
]

const PROBLEMS = [
  { icon: '🧩', title: 'Tool Fragmentation',  desc: 'Notes in Notion. Tasks in Linear. Goals in a spreadsheet. Your brain bridges the gaps manually, every day.' },
  { icon: '🧠', title: 'Cognitive Overload',  desc: 'Every new note forces the same question: "What does this mean? What do I do next? Where does this fit?"' },
  { icon: '🕳️', title: 'The Execution Gap',   desc: 'You have the insight. You know what to do. But no system converts that clarity into a scheduled, trackable action.' },
]

const QUOTES = [
  { text: 'I cancelled Notion, Linear, Obsidian, and Todoist the same week. Pulsar absorbed all four.',             author: 'Kira V.',  role: 'Startup founder' },
  { text: "The spatial canvas is exactly how my brain works. I've tried 12 PKM tools — this is the only one that stuck.", author: 'Dante R.', role: 'Research engineer' },
  { text: 'The focus session commitment mechanics are no joke. I finished my thesis in 3 weeks using Pulsar.',       author: 'Maya L.',  role: 'CS grad student' },
]

// ─── Styles ─────────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@keyframes plFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes plBlink{0%,100%{opacity:1}50%{opacity:0}}
.pl{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd:rgba(255,255,255,0.04);--bd2:rgba(255,255,255,0.07);--bd3:rgba(255,255,255,0.12);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--mn:'JetBrains Mono',monospace;font-family:var(--mn);background:var(--bg);color:var(--t1);overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.6}
.pl *{margin:0;padding:0;box-sizing:border-box}
.pl ::-webkit-scrollbar{width:4px}.pl ::-webkit-scrollbar-track{background:transparent}.pl ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.15);border-radius:2px}
.pl a{color:var(--ac);text-decoration:none;transition:color 0.2s}.pl a:hover{color:#c4b5fd}
.pl-section{padding:96px 48px}
.pl-max{max-width:1080px;margin:0 auto}
.pl-label{font-size:0.7rem;font-weight:600;color:var(--ac);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:16px}
.pl-cursor{display:inline-block;width:2px;height:1em;background:var(--ac);margin-left:2px;vertical-align:text-bottom;animation:plBlink 1s step-end infinite}
@media(max-width:768px){
  .pl-section{padding:64px 20px!important}
  .pl-hero-text h1{font-size:clamp(2rem,8vw,2.8rem)!important}
  .pl-mock{display:none!important}
  .pl-2col{grid-template-columns:1fr!important}
  .pl-pillars{grid-template-columns:1fr 1fr!important}
  .pl-problems{grid-template-columns:1fr!important}
  .pl-quotes{grid-template-columns:1fr!important}
  .pl-footer-inner{flex-direction:column!important;gap:20px!important;text-align:center!important}
  .pl-footer-links{justify-content:center!important}
}
@media(max-width:480px){
  .pl-pillars{grid-template-columns:1fr!important}
}
`

// ─── Editor Mock ────────────────────────────────────────────────────────────────

function EditorMock() {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const tasks = [
    { done: true,  text: 'Ship Calendar refactor',      tag: 'pulsar',  tagColor: '#a78bfa' },
    { done: false, text: 'Review InVenture pitch deck', tag: 'urgent',  tagColor: '#f472b6' },
    { done: false, text: '90min deep work · TypeScript', tag: 'focus',  tagColor: '#6ee7b7' },
    { done: false, text: 'Piano practice — 45 min',     tag: 'health',  tagColor: '#fbbf24' },
  ]
  return (
    <div className="pl-mock" style={{ width: '100%', maxWidth: 520, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: '#0c0c14', overflow: 'hidden', fontFamily: "'JetBrains Mono',monospace" }}>
      {/* Title bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <span style={{ fontSize: '0.68rem', color: '#45455a', marginLeft: 4 }}>corespace / today</span>
      </div>
      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: '0.7rem', color: '#65657a', marginBottom: 14, letterSpacing: '0.04em' }}># Today</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, background: t.done ? 'rgba(110,231,183,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${t.done ? 'rgba(110,231,183,0.08)' : 'rgba(255,255,255,0.04)'}`, animation: `plFadeUp 0.5s ${E} ${i * 0.07}s both` }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: t.done ? 'none' : '1.5px solid rgba(255,255,255,0.12)', background: t.done ? '#6ee7b7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#0d1a14', flexShrink: 0 }}>{t.done && '✓'}</div>
              <span style={{ flex: 1, fontSize: '0.75rem', color: t.done ? '#45455a' : '#a0a0b8', textDecoration: t.done ? 'line-through' : 'none', textDecorationColor: 'rgba(110,231,183,0.3)' }}>{t.text}</span>
              <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 3, background: t.tagColor + '12', color: t.tagColor, letterSpacing: '0.02em', flexShrink: 0 }}>{t.tag}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.68rem', color: '#45455a', display: 'flex', gap: 16 }}>
          <span>→ 3 tasks open</span>
          <span>·</span>
          <span>🔥 21 day streak</span>
          <span>·</span>
          <span>1h 24m left</span>
        </div>
      </div>
    </div>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="pl-footer-inner pl-max" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>pulsar</span>
        </div>
        <div className="pl-footer-links" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[['Features', '/features'], ['Pricing', '/pricing'], ['Changelog', '/changelog'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: '0.72rem', color: '#45455a', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace", transition: 'color 0.2s' }}
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

// ─── Component ──────────────────────────────────────────────────────────────────

interface PulsarLandingProps { onEnter: () => void }

export default function PulsarLanding({ onEnter }: PulsarLandingProps) {
  const router = useRouter()
  const E = 'cubic-bezier(0.22,1,0.36,1)'

  const [betaSlots, setBetaSlots] = useState({ filled: 1, remaining: 99, total: 100 })
  const [scrolled, setScrolled] = useState(false)

  const hero      = useReveal(0.04)
  const intro     = useReveal(0.07)
  const pillarsR  = useReveal(0.05)
  const problemR  = useReveal(0.07)
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
    fetch('/api/beta-count')
      .then(r => { if (!r.ok) throw new Error('bad'); return r.json() })
      .then(d => setBetaSlots({ filled: d.filled ?? 1, remaining: d.remaining ?? 99, total: d.total ?? 100 }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div className="pl">
      <LandingNav variant="fixed" scrolled={scrolled} onGetStarted={onEnter} />

      {/* ── Hero ── */}
      <section ref={hero.ref} className="pl-section" style={{ paddingTop: 128, paddingBottom: 80, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="pl-max" style={{ width: '100%' }}>
          <div style={{ opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(24px)', transition: `all 0.75s ${E}` }}>
            <div className="pl-label">// pulsar</div>
            <div className="pl-hero-text">
              <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 20, fontFamily: "'JetBrains Mono',monospace" }}>
                Your second brain,<br />structured like code.
              </h1>
            </div>
            <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', color: '#a0a0b8', lineHeight: 1.65, maxWidth: 460, marginBottom: 32 }}>
              Notes, tasks, and goals — wired together. One workspace that thinks alongside you.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
              <button onClick={onEnter} style={{ padding: '11px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}` }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >join waitlist</button>
              <button onClick={() => router.push('/features')} style={{ padding: '11px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#a0a0b8', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; e.currentTarget.style.color = '#eeeef5' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#a0a0b8' }}
              >see features →</button>
            </div>
            <EditorMock />
          </div>
        </div>
      </section>

      {/* ── What is Pulsar ── */}
      <section ref={intro.ref} className="pl-section" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0c0c14' }}>
        <div className="pl-max pl-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', opacity: intro.vis ? 1 : 0, transform: intro.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          {/* Text */}
          <div>
            <div className="pl-label">// what is pulsar</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>A workspace that thinks with you.</h2>
            <p style={{ color: '#a0a0b8', lineHeight: 1.7, marginBottom: 16 }}>
              Most tools help you store information. Pulsar helps you act on it. Every note you write, every task you create, every goal you track — they're all connected, searchable, and linked to what matters.
            </p>
            <p style={{ color: '#65657a', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Built for students, researchers, founders, and anyone who thinks deeply and needs a system that keeps up.
            </p>
          </div>
          {/* Document preview */}
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
      <section className="pl-section">
        <div className="pl-max" ref={pillarsR.ref} style={{ opacity: pillarsR.vis ? 1 : 0, transform: pillarsR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label">// the 7 pillars</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 8 }}>Seven systems. One workspace.</h2>
          <p style={{ color: '#65657a', fontSize: '0.88rem', marginBottom: 48 }}>Each pillar is a fully realized module — not a feature checklist.</p>
          {/* Row 1: 4 cards */}
          <div className="pl-pillars" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            {PILLARS.slice(0, 4).map((p, i) => (
              <PillarCard key={p.name} pillar={p} delay={i * 0.05} E={E} />
            ))}
          </div>
          {/* Row 2: 3 cards centered */}
          <div className="pl-pillars" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {PILLARS.slice(4).map((p, i) => (
              <PillarCard key={p.name} pillar={p} delay={(i + 4) * 0.05} E={E} />
            ))}
            {/* spacer to center the 3 */}
            <div />
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="pl-section" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pl-max" ref={problemR.ref} style={{ opacity: problemR.vis ? 1 : 0, transform: problemR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pl-label" style={{ display: 'inline-block' }}>// the problem</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginTop: 4 }}>Why existing tools fail you.</h2>
          </div>
          <div className="pl-problems" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{ padding: '24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#07070c', transition: `border-color 0.2s ${E}`, animation: `plFadeUp 0.5s ${E} ${i * 0.08}s both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#eeeef5', marginBottom: 8, letterSpacing: '-0.01em' }}>{p.title}</div>
                <p style={{ fontSize: '0.8rem', color: '#65657a', lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="pl-section">
        <div className="pl-max" ref={quotesR.ref} style={{ opacity: quotesR.vis ? 1 : 0, transform: quotesR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pl-label" style={{ display: 'inline-block' }}>// early users</div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginTop: 4 }}>People who switched.</h2>
          </div>
          <div className="pl-quotes" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {QUOTES.map((q, i) => (
              <div key={i} style={{ padding: '24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#0c0c14', display: 'flex', flexDirection: 'column', gap: 16, animation: `plFadeUp 0.5s ${E} ${i * 0.08}s both` }}>
                <p style={{ fontSize: '0.83rem', color: '#a0a0b8', lineHeight: 1.7, flex: 1 }}>"{q.text}"</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#eeeef5' }}>{q.author}</div>
                  <div style={{ fontSize: '0.72rem', color: '#45455a', marginTop: 2 }}>{q.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pl-section" style={{ background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
        <div className="pl-max" ref={ctaR.ref} style={{ opacity: ctaR.vis ? 1 : 0, transform: ctaR.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
          <div className="pl-label" style={{ display: 'inline-block' }}>// beta access</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, margin: '8px auto 12px', maxWidth: 560 }}>
            Activate your knowledge.
          </h2>
          <p style={{ color: '#65657a', fontSize: '0.9rem', marginBottom: 32 }}>Start free. No credit card required. {betaSlots.remaining} beta seats remaining.</p>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ width: 180, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ width: `${(betaSlots.filled / betaSlots.total) * 100}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600 }}>{betaSlots.filled}/{betaSlots.total} claimed</span>
          </div>
          <button onClick={onEnter} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: `all 0.2s ${E}` }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >join waitlist →</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ─── Pillar Card ─────────────────────────────────────────────────────────────────

function PillarCard({ pillar, delay, E }: { pillar: typeof PILLARS[0]; delay: number; E: string }) {
  return (
    <div style={{ padding: '20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#0c0c14', transition: `border-color 0.2s ${E}, background 0.2s ${E}`, cursor: 'default', animation: `plFadeUp 0.5s ${E} ${delay}s both` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = pillar.color + '30'; e.currentTarget.style.background = pillar.color + '05' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#0c0c14' }}
    >
      <div style={{ fontSize: '1.1rem', marginBottom: 10, color: pillar.color }}>{pillar.icon}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#eeeef5', marginBottom: 4, letterSpacing: '-0.01em' }}>{pillar.name}</div>
      <div style={{ fontSize: '0.65rem', color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>{pillar.tag}</div>
      <p style={{ fontSize: '0.75rem', color: '#65657a', lineHeight: 1.55 }}>{pillar.desc}</p>
    </div>
  )
}
