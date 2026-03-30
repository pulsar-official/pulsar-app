// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import LandingNav from '@/components/Landing/LandingNav'

// ─── Styles ─────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@keyframes pfFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes blobDrift{0%{transform:translate(0,0)}50%{transform:translate(16px,-12px)}100%{transform:translate(0,0)}}
.pf{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd:rgba(255,255,255,0.04);--bd2:rgba(255,255,255,0.07);--bd3:rgba(255,255,255,0.12);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ok:#6ee7b7;--font:'Inter',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;font-family:var(--font);background:var(--bg);color:var(--t1);overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.6}
.pf *{margin:0;padding:0;box-sizing:border-box}
.pf ::-webkit-scrollbar{width:4px}.pf ::-webkit-scrollbar-track{background:transparent}.pf ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.15);border-radius:2px}
.pf a{color:var(--ac);text-decoration:none;transition:color 0.2s}
.pf-label{font-size:0.68rem;font-weight:600;color:var(--ac);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:14px}
.pf-section{padding:88px 48px}
.pf-max{max-width:1040px;margin:0 auto}
.pf-2col{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
.pf-mock{border-radius:10px;border:1px solid rgba(255,255,255,0.07);background:var(--s1);padding:20px;overflow:hidden}
.pf-sticky-nav{position:sticky;top:55px;z-index:50;background:rgba(7,7,12,0.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.05);padding:10px 48px}
@media(max-width:768px){
  .pf-section{padding:64px 20px!important}
  .pf-2col{grid-template-columns:1fr!important;gap:32px!important}
  .pf-mock{display:none!important}
  .pf-sticky-nav{padding:10px 20px!important;overflow-x:auto}
  .pf-footer-inner{flex-direction:column!important;gap:16px!important;text-align:center!important}
}
`

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useReveal(th = 0.06) {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold: th })
    o.observe(el); return () => o.disconnect()
  }, [th])
  return { ref, v }
}

// ─── Pillar data ────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    id: 'corespace', num: '01', icon: '⬡', name: 'Corespace', tag: 'Command Center', color: '#a78bfa',
    desc: 'Your personalized mission control. Drag-and-drop your entire workflow into one view. Every session starts here — tasks, focus timers, quick capture, and daily agenda in one glance.',
    features: ['Customizable dashboard with drag-and-drop widgets', 'Quick capture (press N anywhere)', 'Daily agenda + time blocks', 'Active project and streak tracking'],
  },
  {
    id: 'knowledge', num: '02', icon: '∞', name: 'Knowledge', tag: 'Spatial Thinking', color: '#818cf8',
    desc: 'Think in webs, not folders. Draw connections between notes on an infinite canvas — like a detective board for your ideas. Every note is a live node with context, backlinks, and linked tasks.',
    features: ['Infinite spatial canvas', 'Bidirectional links and backlinks', 'Auto-suggested connections via AI', 'Node clusters and knowledge maps'],
  },
  {
    id: 'productivity', num: '03', icon: '⚡', name: 'Productivity', tag: 'Deep Work Engine', color: '#6ee7b7',
    desc: 'Tasks, goals, habits, and psychology-driven focus sessions with real commitment mechanics. Flow state is a feature, not a side effect. Built around the science of how high performers actually work.',
    features: ['Focus sessions with commitment mechanics', 'Goal tracking with milestone breakdowns', 'Habit streaks with context tags', 'Kanban, list, and calendar views'],
  },
  {
    id: 'insights', num: '04', icon: '◈', name: 'Insights', tag: 'Pattern Intelligence', color: '#fbbf24',
    desc: 'AI surfaces hidden patterns in your work — focus distribution, streak trajectories, cognitive load scores, and balance forecasts. Your data tells a story. Pulsar reads it for you.',
    features: ['Focus heatmaps and session analytics', 'Cognitive load and balance scores', 'Streak trends and trajectory forecasts', 'Productivity pattern detection'],
  },
  {
    id: 'customization', num: '05', icon: '⬢', name: 'Customization', tag: 'Your Rules', color: '#f472b6',
    desc: 'Build custom note types, views, filters, and automations without writing code. The system bends to you — never the other way around. Define what "done" looks like for your work.',
    features: ['Custom note types with typed fields', 'Saved views and filter presets', 'Automation triggers and rules', 'Theme builder and layout editor'],
  },
  {
    id: 'collaboration', num: '06', icon: '◎', name: 'Collaboration', tag: 'Shared Minds', color: '#38bdf8',
    desc: 'Real-time shared spaces with live presence, role-based permissions, and team knowledge synthesis that compounds over time. Build a shared second brain with your team.',
    features: ['Live collaborative editing with presence', 'Role-based access control', 'Team knowledge graphs', 'Shared workspaces and project rooms'],
  },
  {
    id: 'extensions', num: '07', icon: '⊕', name: 'Extensions', tag: 'Infinite Reach', color: '#f97316',
    desc: 'Plugin system with deep integrations — GitHub, Notion, Figma, Anki, TradingView, and your own APIs. Connect Pulsar to everything you already use. No duct tape required.',
    features: ['GitHub, Figma, Notion sync', 'Anki flashcard export', 'REST API + webhook support', 'Open plugin SDK'],
  },
]

// ─── Static mocks per pillar ────────────────────────────────────────────────────

function CorespaceMock({ color }) {
  const stats = [
    { label: 'Active Projects', val: '5', sub: '2 blocked' },
    { label: 'Focus Today', val: '3h 47m', sub: '4 sessions' },
    { label: 'Streak', val: '🔥 21d', sub: '847 pts' },
    { label: 'Tasks Today', val: '6', sub: '3 done' },
  ]
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># Today · corespace</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)', background: '#07070c' }}>
            <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#eeeef5', marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontSize: '0.62rem', color: '#65657a' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KnowledgeMock({ color }) {
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># knowledge graph</div>
      <svg viewBox="0 0 280 160" style={{ width: '100%', height: 140 }}>
        {/* Edges */}
        {[['45','40','130','30'],['130','30','210','55'],['45','40','70','100'],['70','100','160','110'],['160','110','210','55'],['130','30','160','110']].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" opacity="0.2" strokeDasharray="3 4" />
        ))}
        {/* Nodes */}
        {[{x:45,y:40,r:10,c:color},{x:130,y:30,r:13,c:'#f472b6'},{x:210,y:55,r:10,c:'#818cf8'},{x:70,y:100,r:9,c:'#6ee7b7'},{x:160,y:110,r:10,c:'#fbbf24'},{x:230,y:120,r:7,c:'#38bdf8'}].map((n,i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity="0.7" />
        ))}
        {/* Labels */}
        <text x="52" y="38" fill="#65657a" fontSize="8" fontFamily="JetBrains Mono">Deep Learning</text>
        <text x="143" y="28" fill="#65657a" fontSize="8" fontFamily="JetBrains Mono">Research</text>
        <text x="218" y="53" fill="#65657a" fontSize="8" fontFamily="JetBrains Mono">Math</text>
        <text x="78" y="98" fill="#65657a" fontSize="8" fontFamily="JetBrains Mono">Systems</text>
        <text x="168" y="108" fill="#65657a" fontSize="8" fontFamily="JetBrains Mono">Goals</text>
      </svg>
    </div>
  )
}

function ProductivityMock({ color }) {
  const tasks = [
    { done: true,  text: 'Ship Calendar refactor',   tag: 'pulsar' },
    { done: true,  text: 'BiteRight API integration', tag: 'work' },
    { done: false, text: '90min deep work session',   tag: 'focus' },
    { done: false, text: 'Piano practice — 45min',    tag: 'health' },
    { done: false, text: 'Review pitch deck',         tag: 'urgent' },
  ]
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># today · 3 open</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 6, background: t.done ? 'rgba(110,231,183,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${t.done ? 'rgba(110,231,183,0.08)' : 'rgba(255,255,255,0.04)'}` }}>
            <div style={{ width: 13, height: 13, borderRadius: 3, border: t.done ? 'none' : '1.5px solid rgba(255,255,255,0.12)', background: t.done ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#0d1a14', flexShrink: 0 }}>{t.done && '✓'}</div>
            <span style={{ flex: 1, fontSize: '0.73rem', color: t.done ? '#45455a' : '#a0a0b8', textDecoration: t.done ? 'line-through' : 'none', textDecorationColor: color + '50' }}>{t.text}</span>
            <span style={{ fontSize: '0.58rem', padding: '2px 6px', borderRadius: 3, background: color + '10', color: color }}>{t.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightsMock({ color }) {
  const bars = [40, 65, 80, 55, 90, 72, 48]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># focus this week · 7.2h avg</div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 72, marginBottom: 6 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', height: `${h}%`, borderRadius: '3px 3px 0 0', background: h > 70 ? color + '70' : color + '30' }} />
            <span style={{ fontSize: '0.55rem', color: '#45455a' }}>{days[i]}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {[{ label: 'Focus score', val: '87/100', c: color }, { label: 'Streak', val: '🔥 21d', c: '#f97316' }, { label: 'Load', val: 'balanced', c: '#6ee7b7' }].map((m, i) => (
          <div key={i} style={{ flex: 1, padding: '8px', borderRadius: 6, background: '#07070c', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.58rem', color: '#45455a', marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontSize: '0.73rem', fontWeight: 600, color: m.c }}>{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomizationMock({ color }) {
  const themes = [{ name: 'Void', bg: '#07070c', ac: '#a78bfa' }, { name: 'Forest', bg: '#0a0e0a', ac: '#6ee7b7' }, { name: 'Ember', bg: '#0e0a07', ac: '#f97316' }]
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># theme editor</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {themes.map((t, i) => (
          <div key={i} style={{ flex: 1, borderRadius: 7, border: `1px solid ${i === 0 ? color + '40' : 'rgba(255,255,255,0.06)'}`, background: t.bg, padding: '10px 8px', cursor: 'pointer' }}>
            <div style={{ width: '100%', height: 5, borderRadius: 2, background: t.ac + '70', marginBottom: 6 }} />
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 4 }} />
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', width: '70%' }} />
            <div style={{ fontSize: '0.58rem', color: '#45455a', marginTop: 6, textAlign: 'center' }}>{t.name}</div>
          </div>
        ))}
      </div>
      {[['Accent color', '#a78bfa'], ['Base font', 'JetBrains Mono'], ['Panel density', 'compact']].map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.72rem' }}>
          <span style={{ color: '#65657a' }}>{k}</span>
          <span style={{ color: '#a0a0b8', fontWeight: 500 }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

function CollaborationMock({ color }) {
  const members = [
    { name: 'kira.v', role: 'Owner', online: true },
    { name: 'dante.r', role: 'Editor', online: true },
    { name: 'maya.l', role: 'Viewer', online: false },
  ]
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># team workspace · 3 members</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 7, background: '#07070c', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: [color, '#f472b6', '#fbbf24'][i] + '20', border: `1px solid ${[color, '#f472b6', '#fbbf24'][i]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: [color, '#f472b6', '#fbbf24'][i], flexShrink: 0 }}>{m.name[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#eeeef5' }}>{m.name}</div>
              <div style={{ fontSize: '0.62rem', color: '#45455a' }}>{m.role}</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.online ? '#6ee7b7' : '#45455a', flexShrink: 0 }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', color: '#45455a', padding: '8px 10px', borderRadius: 6, background: color + '08', border: `1px solid ${color}15` }}>
        ✎ dante.r is editing <span style={{ color: '#a0a0b8' }}>Research notes</span>
      </div>
    </div>
  )
}

function ExtensionsMock({ color }) {
  const integrations = [
    { name: 'GitHub', icon: '⌥', desc: 'Sync issues → tasks' },
    { name: 'Figma', icon: '◈', desc: 'Embed designs' },
    { name: 'Anki', icon: '⬡', desc: 'Export flashcards' },
    { name: 'Notion', icon: '∞', desc: 'Import pages' },
  ]
  return (
    <div className="pf-mock">
      <div style={{ fontSize: '0.65rem', color: '#45455a', marginBottom: 12, letterSpacing: '0.04em' }}># integrations · 12 connected</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {integrations.map((int, i) => (
          <div key={i} style={{ padding: '12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)', background: '#07070c', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: color + '12', border: `1px solid ${color}20`, display: 'grid', placeItems: 'center', fontSize: '0.85rem', color, flexShrink: 0 }}>{int.icon}</div>
            <div>
              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#eeeef5' }}>{int.name}</div>
              <div style={{ fontSize: '0.6rem', color: '#45455a' }}>{int.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const MOCKS = {
  corespace: CorespaceMock,
  knowledge: KnowledgeMock,
  productivity: ProductivityMock,
  insights: InsightsMock,
  customization: CustomizationMock,
  collaboration: CollaborationMock,
  extensions: ExtensionsMock,
}

// ─── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ padding: '28px 48px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="pf-footer-inner pf-max" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#7c3aed', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>pulsar</span>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['Home', '/'], ['Pricing', '/pricing'], ['Changelog', '/changelog'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: '0.7rem', color: '#45455a', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#65657a' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#45455a' }}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontSize: '0.68rem', color: '#45455a' }}>© 2026 Pulsar</span>
      </div>
    </footer>
  )
}

// ─── Pillar Section ──────────────────────────────────────────────────────────────

function PillarSection({ pillar, flip }) {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const { ref, v } = useReveal(0.06)
  const MockComp = MOCKS[pillar.id]
  const textCol = (
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>// {pillar.num}&nbsp;&nbsp;{pillar.name}</div>
      <div style={{ fontSize: '0.7rem', color: pillar.color, marginBottom: 12, letterSpacing: '0.04em' }}>{pillar.tag}</div>
      <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>{pillar.name}</h2>
      <p style={{ fontSize: '0.85rem', color: '#a0a0b8', lineHeight: 1.7, marginBottom: 24 }}>{pillar.desc}</p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {pillar.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.8rem', color: '#65657a' }}>
            <span style={{ color: pillar.color, fontSize: '0.65rem', marginTop: 4, flexShrink: 0 }}>✦</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
  const mockCol = <MockComp color={pillar.color} />

  return (
    <section
      id={pillar.id}
      ref={ref}
      className="pf-section"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: parseInt(pillar.num) % 2 === 0 ? '#0c0c14' : '#07070c',
        opacity: v ? 1 : 0,
        transform: v ? 'none' : 'translateY(20px)',
        transition: `all 0.7s ${E}`,
      }}
    >
      <div className="pf-max">
        <div className="pf-2col">
          {flip ? <>{mockCol}{textCol}</> : <>{textCol}{mockCol}</>}
        </div>
      </div>
    </section>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function PulsarFeatures() {
  const E = 'cubic-bezier(0.22,1,0.36,1)'
  const hero = useReveal(0.04)

  useEffect(() => {
    const id = 'pf-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pf">
      <LandingNav />

      {/* Hero */}
      <section
        ref={hero.ref}
        className="pf-section"
        style={{ paddingBottom: 64, position: 'relative', overflow: 'hidden', opacity: hero.v ? 1 : 0, transform: hero.v ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}
      >
        <div aria-hidden style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: 280, height: 220, borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%', background: '#6ee7b7', opacity: 0.04, pointerEvents: 'none', animation: 'blobDrift 24s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="pf-max">
          <div className="pf-label">// features</div>
          <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 16, maxWidth: 600 }}>
            Everything Pulsar does.
          </h1>
          <p style={{ color: '#65657a', fontSize: '0.92rem', lineHeight: 1.65, maxWidth: 520, marginBottom: 40 }}>
            Seven fully realized modules — each solving a distinct part of how you think, work, and learn.
          </p>
          {/* Pill nav */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PILLARS.map(p => (
              <button key={p.id} onClick={() => scrollTo(p.id)}
                style={{ padding: '6px 14px', borderRadius: 100, border: `1px solid ${p.color}25`, background: p.color + '08', color: p.color, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.02em', transition: `all 0.2s ${E}` }}
                onMouseEnter={e => { e.currentTarget.style.background = p.color + '18'; e.currentTarget.style.borderColor = p.color + '50' }}
                onMouseLeave={e => { e.currentTarget.style.background = p.color + '08'; e.currentTarget.style.borderColor = p.color + '25' }}
              >{p.icon} {p.name}</button>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* Pillar sections */}
      {PILLARS.map((p, i) => (
        <PillarSection key={p.id} pillar={p} flip={i % 2 === 1} />
      ))}

      {/* CTA */}
      <section className="pf-section" style={{ textAlign: 'center', background: '#0c0c14', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pf-max">
          <div className="pf-label" style={{ display: 'inline-block' }}>// get started</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '8px auto 12px', maxWidth: 480 }}>
            Ready to connect your thinking?
          </h2>
          <p style={{ color: '#65657a', fontSize: '0.88rem', marginBottom: 28 }}>Join the waitlist. Closed beta · 100 seats total.</p>
          <a href="/sign-up" style={{ display: 'inline-block', padding: '11px 28px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace", transition: `opacity 0.2s ${E}` }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >join waitlist →</a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
