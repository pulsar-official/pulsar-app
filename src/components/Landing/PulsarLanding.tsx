'use client'

import React, { useState, useEffect, useRef } from 'react';
import LandingNav from '@/components/Landing/LandingNav';

interface Particle { x: number; y: number; vx: number; vy: number; s: number; o: number; h: number }

function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const h = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [speed]);
  return offset;
}

function useTyping(texts: string[], speed = 38, pause = 1400, delSpeed = 20) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const cur = texts[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!del && charIdx < cur.length) t = setTimeout(() => setCharIdx(c => c + 1), speed);
    else if (!del && charIdx === cur.length) t = setTimeout(() => setDel(true), pause);
    else if (del && charIdx > 0) t = setTimeout(() => setCharIdx(c => c - 1), delSpeed);
    else if (del && charIdx === 0) { setDel(false); setIdx(i => (i + 1) % texts.length); }
    setDisplay(cur.slice(0, charIdx));
    return () => clearTimeout(t);
  }, [charIdx, del, idx, texts, speed, pause, delSpeed]);
  return display;
}

function useParticles(count: number, ref: React.RefObject<HTMLCanvasElement | null>) {
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      s: Math.random() * 2 + 0.5, o: Math.random() * 0.45 + 0.1, h: 255 + Math.random() * 40,
    }));
    const mv = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', mv);
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const mx = mouse.current.x, my = mouse.current.y;
      particles.current.forEach((p, i) => {
        const dx = p.x - mx, dy = p.y - my, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 170 && dist > 0) { const f = (170 - dist) / 170; p.vx += (dx / dist) * f * 0.55; p.vy += (dy / dist) * f * 0.55; }
        p.vx *= 0.982; p.vy *= 0.982;
        p.vx += (Math.random() - 0.5) * 0.018; p.vy += (Math.random() - 0.5) * 0.018;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},75%,75%,${p.o})`; ctx.fill();
        for (let j = i + 1; j < particles.current.length; j++) {
          const p2 = particles.current[j];
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(268,55%,62%,${0.08 * (1 - d / 120)})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', mv); };
  }, [count, ref]);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PILLARS = [
  { id: 'corespace',     icon: '⬡', name: 'Corespace',     tag: 'Command Center',       desc: 'Your personalized mission control. Drag-and-drop your entire workflow into one view. Every session starts here.',                                      color: '#a78bfa', mockBg: '#0f0d1a' },
  { id: 'knowledge',     icon: '∞', name: 'Knowledge',     tag: 'Spatial Thinking',     desc: 'Detective-board connections on an infinite canvas. Think in webs, not folders. Every note is a live node with real context.',                           color: '#818cf8', mockBg: '#0d0f1a' },
  { id: 'productivity',  icon: '⚡', name: 'Productivity',  tag: 'Deep Work Engine',     desc: 'Tasks, goals, habits, and psychology-driven focus sessions with commitment mechanics. Flow state is a feature, not a side effect.',                     color: '#6ee7b7', mockBg: '#0d1a14' },
  { id: 'insights',      icon: '◈', name: 'Insights',      tag: 'Pattern Intelligence', desc: 'AI surfaces hidden patterns in your work — focus distribution, streak trajectories, cognitive load scores, and balance forecasts.',                    color: '#fbbf24', mockBg: '#1a170d' },
  { id: 'customization', icon: '⬢', name: 'Customization', tag: 'Your Rules',           desc: 'Build custom note types, views, and automations without writing code. The system bends to you — never the other way around.',                          color: '#f472b6', mockBg: '#1a0d15' },
  { id: 'collaboration', icon: '◎', name: 'Collaboration', tag: 'Shared Minds',         desc: 'Real-time shared spaces with live presence, role-based permissions, and team knowledge synthesis that compounds over time.',                           color: '#38bdf8', mockBg: '#0d151a' },
  { id: 'extensions',    icon: '⊕', name: 'Extensions',    tag: 'Infinite Reach',       desc: 'Plugin system with deep integrations — GitHub, Notion, Figma, Anki, and your own APIs. Connect Pulsar to everything you already use.',                color: '#f97316', mockBg: '#1a120d' },
];

const TIERS = [
  { name: 'Atom',     monthlyPrice: 'Free', yearlyPrice: null,  monthlyPeriod: 'forever',            yearlyPeriod: 'forever',            desc: 'For curious starters',            accent: '#808099', popular: false, features: ['Core notes + tasks', 'Limited AI assist (50 req/mo)', '1 workspace · 2 collaborators', 'Basic customization', 'Community support'] },
  { name: 'Molecule', monthlyPrice: '$12',  yearlyPrice: '$10', savePercent: 17, monthlyPeriod: '/month',             yearlyPeriod: '/mo, billed yearly', desc: 'Students & solo learners',        accent: '#a78bfa', popular: false, features: ['Everything in Atom', 'AI summaries + auto-flashcards', '1 knowledge sector hub', '3 accelerator tools', 'Basic dashboards', 'Google Drive sync'] },
  { name: 'Neuron',   monthlyPrice: '$20',  yearlyPrice: '$17', savePercent: 15, monthlyPeriod: '/month',             yearlyPeriod: '/mo, billed yearly', desc: 'Builders & serious learners',     accent: '#6ee7b7', popular: true,  features: ['Everything in Molecule', 'Multi-sector support', 'Advanced AI connections', 'Full focus session suite', 'Team workspaces', 'Slack · Anki · TradingView', 'Advanced customization'] },
  { name: 'Quantum',  monthlyPrice: '$30',  yearlyPrice: '$25', savePercent: 17, monthlyPeriod: '/month',             yearlyPeriod: '/mo, billed yearly', desc: 'Teams, researchers & pros',       accent: '#f472b6', popular: false, features: ['Everything in Neuron', 'Unlimited sectors + bridging', 'Full AI research assistant', 'Priority collab (unlimited)', 'Advanced analytics', 'Full API suite + exports', 'Early access to new pillars'] },
];

const QUOTES = [
  { text: 'I cancelled Notion, Linear, Obsidian, and Todoist the same week. Pulsar absorbed all four.',             author: 'Kira V.',  role: 'Startup founder',    gradient: ['#a78bfa', '#7c3aed'] },
  { text: "The spatial canvas is exactly how my brain works. I've tried 12 PKM tools — this is the only one that stuck.", author: 'Dante R.', role: 'Research engineer',  gradient: ['#818cf8', '#6366f1'] },
  { text: 'The focus session commitment mechanics are no joke. I finished my thesis in 3 weeks using Pulsar.',       author: 'Maya L.',  role: 'CS grad student',    gradient: ['#6ee7b7', '#10b981'] },
];

const STATS = [
  { val: '7',     label: 'Integrated pillars',  mono: false },
  { val: '40K+',  label: 'Notes organized',     mono: true  },
  { val: '< 80ms',label: 'AI response time',    mono: true  },
  { val: '0',     label: 'Context switches',    mono: false },
];

const FEATURES = [
  { icon: '⚡', label: 'Pomodoro + deep work' },
  { icon: '∞',  label: 'Infinite canvas' },
  { icon: '🧠', label: 'AI connections' },
  { icon: '◈',  label: 'Focus analytics' },
  { icon: '⬡',  label: 'Custom workflows' },
];

const DEAD_NOTES  = [{ text: 'Systems Design notes', tag: '📖' }, { text: 'Startup ideas doc', tag: '💡' }, { text: 'Language learning', tag: '🌐' }, { text: 'OKR journal', tag: '🎯' }, { text: 'Research paper', tag: '📋' }, { text: 'Training plan', tag: '💪' }];
const ALIVE_NOTES = [
  { text: 'Systems Design → 28 flashcards', color: '#6ee7b7', st: 'active',    tag: '📖' },
  { text: 'Startup ideas → 3 projects',     color: '#38bdf8', st: 'linked',    tag: '💡' },
  { text: 'Language → daily drills set',    color: '#a78bfa', st: 'recurring', tag: '🌐' },
  { text: 'OKR → milestones tracked',       color: '#fbbf24', st: 'active',    tag: '🎯' },
  { text: 'Research → cited + indexed',     color: '#818cf8', st: 'enriched',  tag: '📋' },
  { text: 'Training → habit tracked',       color: '#f97316', st: 'tracking',  tag: '💪' },
];
const CALLOUTS = [
  { label: 'Procrastination loop', icon: '😴', x: '2%',  y: '3%'  },
  { label: 'Lost context',         icon: '🚨', x: '60%', y: '2%'  },
  { label: 'Cognitive overload',   icon: '🧠', x: '1%',  y: '80%' },
  { label: 'Useless AI',           icon: '🤖', x: '62%', y: '82%' },
  { label: 'Tool fragmentation',   icon: '🧩', x: '28%', y: '91%' },
];
const WHY_ITEMS = [
  { icon: '😴', title: 'Procrastination Loop',      desc: "Saving notes feels like progress. But without a path to action, you're just collecting — not building." },
  { icon: '🚨', title: 'Lost Context',              desc: 'Notes taken in the moment decay fast. By the time you return, the spark of insight is gone.' },
  { icon: '🧩', title: 'Tool Fragmentation',        desc: 'Notes in Notion. Tasks in Linear. Goals in a spreadsheet. Your brain bridges the gaps manually, constantly.' },
  { icon: '🧠', title: 'Cognitive Overload',        desc: 'You manually ask: "What does this mean? What do I do next? Where does this fit?" — every single time.' },
  { icon: '🤖', title: 'AI That Misses the Point',  desc: "Current AI summarizes text. It doesn't connect your knowledge to your goals and move you forward." },
];

// ─── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
@keyframes plFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes plPulse{0%,100%{opacity:0.3}50%{opacity:1}}
@keyframes plGlow{0%,100%{box-shadow:0 0 22px rgba(167,139,250,0.1),0 4px 28px rgba(0,0,0,0.3)}50%{box-shadow:0 0 55px rgba(167,139,250,0.3),0 8px 40px rgba(0,0,0,0.45)}}
@keyframes plOrbit{from{transform:rotate(0deg) translateX(160px) rotate(0deg)}to{transform:rotate(360deg) translateX(160px) rotate(-360deg)}}
@keyframes plOrbit2{from{transform:rotate(0deg) translateX(240px) rotate(0deg)}to{transform:rotate(360deg) translateX(240px) rotate(-360deg)}}
@keyframes plDrift{0%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(22px,-16px) rotate(120deg)}66%{transform:translate(-16px,10px) rotate(240deg)}100%{transform:translate(0,0) rotate(360deg)}}
@keyframes plShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes plBorderPulse{0%,100%{border-color:rgba(167,139,250,0.08)}50%{border-color:rgba(167,139,250,0.3)}}
@keyframes plScanline{0%{top:-2px;opacity:0}15%{opacity:0.8}85%{opacity:0.8}100%{top:100%;opacity:0}}
@keyframes plFadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes plReveal{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes plBlink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes plCallIn{from{opacity:0;transform:translateY(8px) scale(0.93)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes plPillIn{from{opacity:0;transform:translateY(12px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes plNodePop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}
.pl-root{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--border:rgba(255,255,255,0.04);--border2:rgba(255,255,255,0.08);--border3:rgba(167,139,250,0.15);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--accent:#a78bfa;--accent2:#c4b5fd;--accent3:#7c3aed;--font:'Space Grotesk',system-ui,sans-serif;--mono:'JetBrains Mono','Fira Code',monospace;font-family:var(--font);background:var(--bg);color:var(--t1);overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.5}
.pl-root ::-webkit-scrollbar{width:5px}.pl-root ::-webkit-scrollbar-track{background:transparent}.pl-root ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.15);border-radius:3px}
.pl-root a{color:var(--accent);text-decoration:none;transition:color 0.2s}.pl-root a:hover{color:var(--accent2)}
.pl-shimmer{background:linear-gradient(90deg,#a78bfa 0%,#e879f9 18%,#c4b5fd 36%,#818cf8 54%,#a78bfa 72%,#e879f9 90%,#c4b5fd 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:plShimmer 4s linear infinite}
.pl-glow{animation:plGlow 3s ease-in-out infinite}.pl-glow:hover{animation:none;box-shadow:0 0 72px rgba(167,139,250,0.38),0 12px 48px rgba(0,0,0,0.5)}
.pl-grid-overlay{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(167,139,250,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.012) 1px,transparent 1px);background-size:64px 64px}
.pl-noise{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0.02;background:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
`;

// ─── PillarMock ────────────────────────────────────────────────────────────────

function PillarMock({ pillar, active }: { pillar: typeof PILLARS[0]; active: boolean }) {
  const E = 'cubic-bezier(0.16,1,0.3,1)';
  const base: React.CSSProperties = {
    position: 'absolute', inset: 0,
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.985)',
    transition: `all 0.55s ${E}`,
    pointerEvents: active ? 'auto' : 'none',
    padding: '20px', background: pillar.mockBg,
  };
  const card = (title: string, sub: string, delay: string) => (
    <div style={{ padding: '11px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${pillar.color}18`, marginBottom: '8px', opacity: active ? 1 : 0, transform: active ? 'none' : 'translateX(-14px)', transition: `all 0.5s ${E} ${delay}` }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{sub}</div>
    </div>
  );
  const p = pillar.id;
  return (
    <div style={base}>
      {p === 'corespace' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {card('Active Projects', '5 in progress · 2 blocked', '0.05s')}
            {card('Focus Today', '3h 47m · 4 sessions', '0.1s')}
            {card('Quick Capture', 'Press N to capture...', '0.15s')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {card('Streak', '🔥 21 days · 847 pts', '0.08s')}
            {card('Today', '6 tasks · 3 events', '0.13s')}
            <div style={{ flex: 1, borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '11px', opacity: active ? 1 : 0, transition: `opacity 0.5s ease 0.2s` }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--t4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: '8px' }}>This week</div>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '44px' }}>
                {[35, 70, 55, 85, 72, 60, 28].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: active ? `${h}%` : '0%', borderRadius: '3px', background: `${pillar.color}${h > 60 ? '55' : '28'}`, transition: `height 0.65s ${E} ${0.22 + i * 0.05}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {p === 'knowledge' && (
        <div style={{ position: 'relative', height: '100%' }}>
          {[
            [16, 18, 13, '0.05s', '#a78bfa'], [46, 9,  11, '0.1s',  '#f472b6'],
            [72, 28, 13, '0.08s', '#818cf8'], [28, 58, 11, '0.15s', '#6ee7b7'],
            [62, 62, 13, '0.12s', '#fbbf24'], [50, 38, 9,  '0.18s', '#38bdf8'],
          ].map(([x, y, sz, d, color], i) => (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${sz}px`, height: `${sz}px`, borderRadius: '50%', background: color as string, opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0)', transition: `all 0.45s cubic-bezier(0.34,1.56,0.64,1) ${d}`, boxShadow: active ? `0 0 14px ${color}70` : 'none' }} />
          ))}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: active ? 0.45 : 0, transition: `opacity 0.65s ease 0.22s` }}>
            <line x1="23%" y1="25%" x2="49%" y2="16%" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="49%" y1="16%" x2="75%" y2="35%" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="23%" y1="25%" x2="31%" y2="65%" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="65%" y1="69%" x2="31%" y2="65%" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="53%" y1="45%" x2="49%" y2="16%" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.6" />
          </svg>
          <div style={{ position: 'absolute', left: '8%', top: '36%', opacity: active ? 1 : 0, transition: `opacity 0.5s ease 0.3s` }}>{card('Deep Learning', '14 connected concepts', '0.3s')}</div>
          <div style={{ position: 'absolute', right: '4%', top: '46%', opacity: active ? 1 : 0, transition: `opacity 0.5s ease 0.4s` }}>{card('Research Graph', '7 new links found', '0.4s')}</div>
        </div>
      )}
      {p === 'productivity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
          {[
            { t: 'Ship Calendar refactor',        done: true,  tag: 'pulsar'  },
            { t: 'BiteRight API integration',      done: true,  tag: 'work'   },
            { t: '90-min deep work: TypeScript',   done: false, tag: 'focus'  },
            { t: 'Piano practice (45 min)',         done: false, tag: 'health' },
            { t: 'Review InVenture pitch deck',     done: false, tag: 'urgent' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 13px', borderRadius: '8px', background: item.done ? 'rgba(110,231,183,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${item.done ? 'rgba(110,231,183,0.1)' : 'rgba(255,255,255,0.04)'}`, opacity: active ? 1 : 0, transform: active ? 'none' : 'translateX(-18px)', transition: `all 0.45s ${E} ${i * 0.065}s` }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: item.done ? 'none' : '2px solid rgba(255,255,255,0.15)', background: item.done ? '#6ee7b7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#111', flexShrink: 0 }}>{item.done && '✓'}</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: item.done ? 'var(--t4)' : 'var(--t1)', textDecoration: item.done ? 'line-through' : 'none', textDecorationColor: 'rgba(110,231,183,0.4)', flex: 1 }}>{item.t}</span>
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--t4)', padding: '2px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)' }}>{item.tag}</span>
            </div>
          ))}
          <div style={{ marginTop: 'auto', padding: '10px 13px', borderRadius: '8px', background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.12)', opacity: active ? 1 : 0, transition: `opacity 0.5s ease 0.42s` }}>
            <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontFamily: 'var(--mono)', fontWeight: 600 }}>⚡ DEEP WORK ACTIVE — 52:17 remaining</div>
          </div>
        </div>
      )}
      {p === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[{ label: 'Focus', val: '7.4h', c: pillar.color }, { label: 'Chill', val: '1.8h', c: '#6ee7b7' }, { label: 'Streak', val: '21d', c: '#f472b6' }].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '11px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(14px)', transition: `all 0.5s ${E} ${i * 0.08}s` }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.c }}>{s.val}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--t4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, borderRadius: '8px', background: 'rgba(255,255,255,0.02)', padding: '13px', border: '1px solid rgba(255,255,255,0.04)', opacity: active ? 1 : 0, transition: `opacity 0.5s ease 0.26s` }}>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--mono)', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: '10px' }}>Focus vs recover — this week</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '75px' }}>
              {[28, 72, 85, 45, 92, 50, 18].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ height: active ? `${h}%` : '0%', borderRadius: '3px 3px 0 0', background: `${pillar.color}55`, transition: `height 0.7s ${E} ${0.28 + i * 0.06}s` }} />
                  <div style={{ height: active ? `${Math.max(0, 78 - h - 8)}%` : '0%', borderRadius: '0 0 3px 3px', background: 'rgba(110,231,183,0.18)', transition: `height 0.7s ${E} ${0.33 + i * 0.06}s` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {(p === 'customization' || p === 'collaboration' || p === 'extensions') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', height: '100%' }}>
          {(p === 'customization'
            ? [{ t: 'Note Type Builder',  s: 'Zettel · Journal · Decision Log',   d: '0.05s' }, { t: 'View Builder',    s: 'Kanban · Spatial · Timeline', d: '0.12s' }, { t: 'Automation Rules', s: '14 active · 3 pending', d: '0.18s' }]
            : p === 'collaboration'
            ? [{ t: '4 members live',     s: 'Kira · Dante · Maya · Sam',          d: '0.05s' }, { t: 'Shared Canvas',  s: 'Q2 Strategy Board',           d: '0.12s' }, { t: 'Role: Admin',      s: 'Full access · Audit log on', d: '0.18s' }]
            : [{ t: 'GitHub',             s: 'Connected · 18 repos synced',         d: '0.05s' }, { t: 'Figma',          s: 'Connected · Auto-import on',  d: '0.12s' }, { t: 'Custom API',       s: 'api.yourcompany.io · live',  d: '0.18s' }]
          ).map((item, i) => <div key={i}>{card(item.t, item.s, item.d)}</div>)}
          <div style={{ flex: 1, borderRadius: '8px', background: `${pillar.color}07`, border: `1px solid ${pillar.color}14`, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0, transition: `opacity 0.5s ease 0.28s` }}>
            <span style={{ fontSize: '0.75rem', color: pillar.color, fontFamily: 'var(--mono)', fontWeight: 500 }}>
              {p === 'customization' ? '+ Create new template' : p === 'collaboration' ? '+ Invite team member' : '+ Add integration'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DeadKnowledgeLoop ────────────────────────────────────────────────────────

function DeadKnowledgeLoop() {
  const reveal = useReveal(0.06);
  const [stage, setStage] = useState(-1);
  useEffect(() => { if (reveal.vis && stage === -1) setStage(0); }, [reveal.vis]);
  useEffect(() => {
    if (stage === -1) return;
    const delays: Record<number, number> = { 0: 1600, 1: 2000, 2: 3200, 3: 650, 4: 3800, 5: 1400 };
    const next: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 0 };
    const t = setTimeout(() => setStage(next[stage] ?? 0), delays[stage] ?? 2000);
    return () => clearTimeout(t);
  }, [stage]);
  const struck = stage >= 1 && stage < 3;
  const callouts = stage === 2;
  const dissolve = stage === 3;
  const alive = stage === 4 || stage === 5;
  const E = 'cubic-bezier(0.16,1,0.3,1)';
  return (
    <section ref={reveal.ref} style={{ padding: '100px 40px', background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px', opacity: reveal.vis ? 1 : 0, transform: reveal.vis ? 'none' : 'translateY(18px)', transition: `all 0.75s ${E}` }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', fontWeight: 600, color: alive ? '#6ee7b7' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px', transition: 'color 0.6s' }}>{alive ? '// knowledge_activated' : '// the_dead_knowledge_problem'}</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1 }}>
            {alive ? (<>Pulsar <span style={{ color: '#6ee7b7' }}>activates</span> your knowledge.</>) : (<>Your notes are <span style={{ color: '#ef4444' }}>dying.</span></>)}
          </h2>
        </div>
        <div style={{ position: 'relative', minHeight: '360px', borderRadius: '14px', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border2)', padding: '28px 24px', overflow: 'hidden' }}>
          {callouts && !alive && CALLOUTS.map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, zIndex: 10, animation: `plCallIn 0.4s ${E} ${i * 0.08}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 13px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)', fontSize: '0.82rem', fontWeight: 600, color: '#fca5a5', whiteSpace: 'nowrap' }}>
                <span>{c.icon}</span>{c.label}
              </div>
            </div>
          ))}
          <div style={{ opacity: alive ? 0 : dissolve ? 0 : 1, filter: dissolve ? 'blur(6px)' : 'none', transform: dissolve ? 'scale(0.96)' : 'none', transition: `all 0.65s ease`, position: alive ? 'absolute' : 'relative', inset: alive ? 0 : undefined, padding: alive ? '28px 24px' : 0, pointerEvents: alive ? 'none' : 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {DEAD_NOTES.map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 15px', borderRadius: '10px', background: struck ? 'rgba(239,68,68,0.02)' : 'rgba(255,255,255,0.025)', border: `1px solid ${struck ? 'rgba(239,68,68,0.07)' : 'var(--border2)'}`, transition: `all 0.5s ease ${i * 0.045}s`, opacity: reveal.vis ? 1 : 0, transform: reveal.vis ? 'none' : 'translateY(10px)' }}>
                  <span style={{ fontSize: '1.1rem' }}>{n.tag}</span>
                  <span style={{ fontSize: '0.92rem', color: struck ? 'var(--t4)' : 'var(--t2)', flex: 1, textDecoration: struck ? 'line-through' : 'none', textDecorationColor: 'rgba(239,68,68,0.3)', transition: 'all 0.4s' }}>{n.text}</span>
                  {struck && <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: '#ef4444', opacity: 0.45 }}>dead</span>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ opacity: alive ? 1 : 0, filter: alive ? 'none' : 'blur(6px)', transform: alive ? 'none' : 'scale(0.96)', transition: `all 0.7s ${E}`, position: !alive ? 'absolute' : 'relative', inset: !alive ? 0 : undefined, padding: !alive ? '28px 24px' : 0, pointerEvents: alive ? 'auto' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {ALIVE_NOTES.map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 15px', borderRadius: '10px', background: `${n.color}07`, border: `1px solid ${n.color}16`, opacity: alive ? 1 : 0, transform: alive ? 'none' : 'translateY(10px)', transition: `all 0.5s ${E} ${i * 0.05}s` }}>
                  <span style={{ fontSize: '1.1rem' }}>{n.tag}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--t2)', flex: 1 }}>{n.text}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: `${n.color}10`, color: n.color }}>{n.st}</span>
                </div>
              ))}
            </div>
            {stage >= 5 && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '22px', flexWrap: 'wrap' }}>
                {[{ l: 'note → plan → execution', c: '#a78bfa' }, { l: 'AI that moves you forward', c: '#6ee7b7' }, { l: 'zero context switches', c: '#f472b6' }].map((ch, i) => (
                  <span key={i} style={{ padding: '7px 15px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, background: `${ch.c}08`, border: `1px solid ${ch.c}1a`, color: ch.c }}>{ch.l}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '20px' }}>
            {['Capture', 'Decay', 'Problems', '·', 'Activated', '↻'].map((s, i) => (
              <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', padding: '4px 10px', borderRadius: '5px', background: stage === i ? (i >= 4 ? 'rgba(110,231,183,0.08)' : 'rgba(167,139,250,0.08)') : 'transparent', color: stage === i ? (i >= 4 ? '#6ee7b7' : 'var(--accent)') : 'var(--t4)', transition: 'all 0.3s' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WhyItMatters ─────────────────────────────────────────────────────────────

function WhyItMatters() {
  const reveal = useReveal(0.06);
  const E = 'cubic-bezier(0.16,1,0.3,1)';
  return (
    <section ref={reveal.ref} style={{ padding: '100px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px', opacity: reveal.vis ? 1 : 0, transform: reveal.vis ? 'none' : 'translateY(22px)', transition: `all 0.75s ${E}` }}>
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px' }}>{'// why_it_matters'}</div>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1 }}>Knowledge dies at the capture stage.</h2>
        <p style={{ color: 'var(--t2)', fontSize: '1rem', marginTop: '16px', maxWidth: '560px', margin: '16px auto 0', lineHeight: 1.65 }}>There's no seamless path from <span style={{ color: 'var(--t1)', fontWeight: 600 }}>note</span> → <span style={{ color: 'var(--t1)', fontWeight: 600 }}>plan</span> → <span style={{ color: 'var(--t1)', fontWeight: 600 }}>execution</span>. People don't need more storage — they need a system that activates their knowledge.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
        {WHY_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '24px', borderRadius: '14px', background: 'var(--s2)', border: '1px solid var(--border)', opacity: reveal.vis ? 1 : 0, transform: reveal.vis ? 'none' : 'translateY(22px)', transition: `all 0.65s ${E} ${i * 0.055}s`, cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.16)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(0,0,0,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.01em' }}>{item.title}</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--t3)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface PulsarLandingProps { onEnter: () => void }

export default function PulsarLanding({ onEnter }: PulsarLandingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticles(90, canvasRef);
  const parallax1 = useParallax(0.12);
  const parallax2 = useParallax(0.06);

  useEffect(() => {
    const id = 'pl-styles';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  const typed = useTyping(['thinkers.', 'builders.', 'polymaths.', 'obsessives.', 'researchers.', 'creators.'], 38, 1400, 20);
  const hero     = useReveal(0.04);
  const stats    = useReveal(0.12);
  const showcase = useReveal(0.07);
  const pricing  = useReveal(0.08);
  const quotes   = useReveal(0.08);
  const cta      = useReveal(0.08);

  const [activePillar, setActivePillar] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    if (!autoCycle || !showcase.vis) return;
    const iv = setInterval(() => setActivePillar(p => (p + 1) % 7), 4200);
    return () => clearInterval(iv);
  }, [autoCycle, showcase.vis]);

  useEffect(() => {
    const h = () => {
      setScrolled(window.scrollY > 50);
      const t = document.documentElement.scrollHeight - window.innerHeight;
      setProg(t > 0 ? window.scrollY / t : 0);
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const ap = PILLARS[activePillar];
  const E = 'cubic-bezier(0.16,1,0.3,1)';

  return (
    <div className="pl-root">
      <div className="pl-grid-overlay" />
      <div className="pl-noise" />
      <div style={{ position: 'fixed', top: 0, left: 0, height: '2px', zIndex: 1000, width: `${prog * 100}%`, background: 'linear-gradient(90deg,#a78bfa,#e879f9,#818cf8)', transition: 'width 0.06s linear' }} />

      {/* NAV */}
      <LandingNav variant="fixed" scrolled={scrolled} onGetStarted={onEnter} />

      {/* HERO */}
      <section ref={hero.ref} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 40px 80px', textAlign: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: `calc(50% + ${parallax1}px)`, left: '50%', transform: 'translate(-50%,-50%)', width: '460px', height: '460px', borderRadius: '50%', border: '1px solid rgba(167,139,250,0.06)', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-5px', left: '50%', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', animation: 'plOrbit 20s linear infinite', opacity: 0.7, boxShadow: '0 0 14px rgba(167,139,250,0.9)' }} />
        </div>
        <div style={{ position: 'absolute', top: `calc(50% + ${parallax2}px)`, left: '50%', transform: 'translate(-50%,-50%)', width: '660px', height: '660px', borderRadius: '50%', border: '1px solid rgba(167,139,250,0.03)', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-4px', left: '50%', width: '7px', height: '7px', borderRadius: '50%', background: '#e879f9', animation: 'plOrbit2 36s linear infinite reverse', opacity: 0.45, boxShadow: '0 0 12px rgba(232,121,249,0.7)' }} />
        </div>
        <div style={{ position: 'absolute', top: `calc(50% + ${parallax1}px)`, left: '50%', transform: 'translate(-50%,-50%)', width: '1000px', height: '1000px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.13) 0%,rgba(124,58,237,0.03) 35%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '860px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 16px', borderRadius: '100px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: '32px', fontSize: '0.72rem', fontFamily: 'var(--mono)', color: 'var(--t3)', opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(20px)', transition: `all 0.7s ${E}` }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6ee7b7', animation: 'plPulse 2s ease infinite', flexShrink: 0 }} />
            v0.1 · invite-only private beta · 847 on waitlist
          </div>
          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(2.8rem,5.8vw,4.5rem)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.04em', marginBottom: '22px', opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(40px)', transition: `all 0.9s ${E} 0.1s` }}>
            The knowledge OS<br /><span className="pl-shimmer">for {typed}</span><span style={{ color: 'var(--accent)', animation: 'plBlink 1s step-end infinite' }}>_</span>
          </h1>
          {/* Sub */}
          <p style={{ fontSize: 'clamp(0.95rem,1.8vw,1.12rem)', color: 'var(--t2)', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto 40px', opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(30px)', transition: `all 0.9s ${E} 0.2s` }}>
            Seven pillars. Infinite canvas. One unified system that bridges the gap between{' '}
            <span style={{ color: 'var(--t1)', fontWeight: 600 }}>idea</span>,{' '}
            <span style={{ color: 'var(--t1)', fontWeight: 600 }}>action</span>, and{' '}
            <span style={{ color: 'var(--t1)', fontWeight: 600 }}>implementation</span>.
          </p>
          {/* CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(30px)', transition: `all 0.9s ${E} 0.3s` }}>
            <button className="pl-glow" onClick={onEnter} style={{ padding: '14px 36px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', letterSpacing: '-0.01em', transition: `all 0.3s ${E}` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 18px 52px rgba(124,58,237,0.48)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}>Request Access →</button>
            <button onClick={onEnter} style={{ padding: '14px 36px', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.18)', background: 'rgba(167,139,250,0.04)', color: 'var(--t2)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', transition: `all 0.3s ${E}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.18)'; e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'rgba(167,139,250,0.04)'; }}>Watch Demo</button>
          </div>
          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '36px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '100px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', color: 'var(--t3)', fontFamily: 'var(--mono)', animation: hero.vis ? `plPillIn 0.55s ${E} ${0.65 + i * 0.07}s both` : 'none' }}>
                <span style={{ fontSize: '0.8rem' }}>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
        </div>
        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: hero.vis ? 0.3 : 0, transition: 'opacity 1.2s ease 1.4s' }}>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--mono)', color: 'var(--t4)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom,var(--accent),transparent)', animation: 'plPulse 2s ease infinite' }} />
        </div>
      </section>

      {/* STATS */}
      <section ref={stats.ref} style={{ display: 'flex', justifyContent: 'center', gap: '56px', flexWrap: 'wrap', padding: '56px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--s1)' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', opacity: stats.vis ? 1 : 0, transform: stats.vis ? 'none' : 'translateY(20px)', transition: `all 0.65s ${E} ${i * 0.07}s` }}>
            <div style={{ fontFamily: s.mono ? 'var(--mono)' : 'var(--font)', fontSize: '1.9rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.025em' }}>{s.val}</div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--t4)', marginTop: '6px', letterSpacing: '0.02em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      <DeadKnowledgeLoop />
      <WhyItMatters />

      {/* DASHBOARD SHOWCASE */}
      <section id="features" ref={showcase.ref} style={{ padding: '110px 40px', maxWidth: '1220px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px', opacity: showcase.vis ? 1 : 0, transform: showcase.vis ? 'none' : 'translateY(26px)', transition: `all 0.75s ${E}` }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px' }}>{'// live_preview'}</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.8vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.08 }}>Seven pillars. One living system.</h2>
          <p style={{ color: 'var(--t2)', fontSize: '1rem', marginTop: '16px', maxWidth: '520px', margin: '16px auto 0', lineHeight: 1.65 }}>Click a pillar to see it in action. Each one is powerful alone — together they are unstoppable.</p>
        </div>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px', opacity: showcase.vis ? 1 : 0, transform: showcase.vis ? 'none' : 'translateY(20px)', transition: `all 0.75s ${E} 0.12s` }}>
          {PILLARS.map((p, i) => (
            <button key={p.id} onClick={() => { setActivePillar(i); setAutoCycle(false); }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid transparent', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', background: activePillar === i ? `${p.color}14` : 'transparent', color: activePillar === i ? p.color : 'var(--t3)', borderColor: activePillar === i ? `${p.color}28` : 'transparent', transition: `all 0.22s ${E}` }}
              onMouseEnter={e => { if (activePillar !== i) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'var(--s2)'; } }}
              onMouseLeave={e => { if (activePillar !== i) { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'transparent'; } }}>
              <span style={{ fontSize: '0.85rem' }}>{p.icon}</span>{p.name}
            </button>
          ))}
        </div>
        <div style={{ borderRadius: '14px', border: `1px solid ${ap.color}1a`, overflow: 'hidden', boxShadow: `0 32px 110px rgba(0,0,0,0.5),0 0 0 1px ${ap.color}07`, opacity: showcase.vis ? 1 : 0, transform: showcase.vis ? 'none' : 'scale(0.96) translateY(22px)', transition: `all 0.85s ${E} 0.22s`, animation: showcase.vis ? 'plBorderPulse 5s ease infinite' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--t4)' }}>{'pulsar.app — ' + ap.name.toLowerCase()}</div>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {autoCycle && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6ee7b7', animation: 'plPulse 1.5s ease infinite' }} />}
              {autoCycle ? 'auto-cycling' : 'manual'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '176px 1fr', minHeight: '360px' }}>
            <div style={{ borderRight: '1px solid var(--border)', padding: '12px 8px', background: 'var(--s1)' }}>
              {PILLARS.map((p, i) => (
                <div key={p.id} onClick={() => { setActivePillar(i); setAutoCycle(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', marginBottom: '2px', cursor: 'pointer', background: activePillar === i ? `${p.color}0e` : 'transparent', transition: `all 0.18s ${E}` }}
                  onMouseEnter={e => { if (activePillar !== i) e.currentTarget.style.background = 'var(--s2)'; }}
                  onMouseLeave={e => { if (activePillar !== i) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: '0.78rem', color: activePillar === i ? p.color : 'var(--t4)', transition: 'color 0.18s' }}>{p.icon}</span>
                  <span style={{ fontSize: '0.77rem', fontWeight: activePillar === i ? 600 : 400, color: activePillar === i ? 'var(--t1)' : 'var(--t3)', transition: 'all 0.18s' }}>{p.name}</span>
                  {activePillar === i && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: p.color, boxShadow: `0 0 7px ${p.color}` }} />}
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${ap.color}22,transparent)`, animation: 'plScanline 4.5s linear infinite', zIndex: 2, pointerEvents: 'none' }} />
              {PILLARS.map((p, i) => <PillarMock key={p.id} pillar={p} active={activePillar === i} />)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: ap.color }}>{ap.icon}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--t1)' }}>{ap.name}</span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--mono)', color: 'var(--t4)', marginLeft: '8px', padding: '2px 7px', borderRadius: '4px', background: `${ap.color}0a`, border: `1px solid ${ap.color}12` }}>{ap.tag}</span>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {PILLARS.map((_, i) => (
                <div key={i} style={{ width: activePillar === i ? '20px' : '5px', height: '5px', borderRadius: '3px', background: activePillar === i ? ap.color : 'var(--s4)', transition: `all 0.35s ${E}`, cursor: 'pointer' }}
                  onClick={() => { setActivePillar(i); setAutoCycle(false); }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '28px', minHeight: '56px' }}>
          <p key={activePillar} style={{ fontSize: '0.95rem', color: 'var(--t2)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.65, animation: 'plFadeUp 0.38s cubic-bezier(0.16,1,0.3,1)' }}>{ap.desc}</p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" ref={pricing.ref} style={{ padding: '100px 40px', background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px', opacity: pricing.vis ? 1 : 0, transform: pricing.vis ? 'none' : 'translateY(26px)', transition: `all 0.75s ${E}` }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px' }}>{'// pricing'}</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.8vw,2.7rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1 }}>Simple, transparent pricing.</h2>
            <p style={{ color: 'var(--t2)', fontSize: '1rem', marginTop: '16px' }}>One plan for every stage. Upgrade or downgrade anytime.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginTop: '28px', padding: '6px 8px', borderRadius: '100px', background: 'var(--s2)', border: '1px solid var(--border2)' }}>
              <span onClick={() => setYearly(false)} style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', color: yearly ? 'var(--t3)' : 'var(--t1)', fontWeight: yearly ? 400 : 600, padding: '4px 14px', borderRadius: '100px', background: yearly ? 'transparent' : 'var(--s3)', transition: 'all 0.25s', cursor: 'pointer' }}>Monthly</span>
              <div onClick={() => setYearly(y => !y)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: yearly ? 'var(--accent)' : 'var(--s4)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: yearly ? '21px' : '3px', transition: `left 0.3s ${E}`, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </div>
              <span onClick={() => setYearly(true)} style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', color: yearly ? 'var(--t1)' : 'var(--t3)', fontWeight: yearly ? 600 : 400, padding: '4px 14px', borderRadius: '100px', background: yearly ? 'var(--s3)' : 'transparent', transition: 'all 0.25s', cursor: 'pointer' }}>Yearly</span>
              {yearly && <span style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', padding: '3px 10px', borderRadius: '100px', background: 'rgba(110,231,183,0.1)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.2)', fontWeight: 600, animation: 'plFadeUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>save up to 17%</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', alignItems: 'stretch' }}>
            {TIERS.map((tier, i) => {
              const price = yearly && tier.yearlyPrice ? tier.yearlyPrice : tier.monthlyPrice;
              const period = yearly && tier.yearlyPrice ? tier.yearlyPeriod : tier.monthlyPeriod;
              return (
                <div key={tier.name} style={{ padding: tier.popular ? '2px' : '0', borderRadius: '14px', background: tier.popular ? 'linear-gradient(135deg,#6ee7b7,#38bdf8,#a78bfa)' : 'transparent', display: 'flex', opacity: pricing.vis ? 1 : 0, transform: pricing.vis ? (tier.popular ? 'translateY(-4px)' : 'none') : 'translateY(26px)', transition: `all 0.65s ${E} ${i * 0.07}s` }}>
                  <div style={{ padding: '26px', borderRadius: tier.popular ? '12px' : '14px', display: 'flex', flexDirection: 'column', flex: 1, background: tier.popular ? 'var(--s2)' : 'var(--s1)', border: tier.popular ? 'none' : '1px solid var(--border2)', position: 'relative', overflow: 'hidden', transition: `all 0.25s ${E}` }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 18px 52px rgba(0,0,0,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    {tier.popular && <div style={{ position: 'absolute', top: '14px', right: '14px', padding: '3px 10px', borderRadius: '100px', background: `${tier.accent}14`, border: `1px solid ${tier.accent}22`, fontSize: '0.58rem', fontFamily: 'var(--mono)', fontWeight: 700, color: tier.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Popular</div>}
                    {yearly && tier.savePercent && <div style={{ position: 'absolute', top: '14px', left: '14px', padding: '3px 8px', borderRadius: '6px', background: `${tier.accent}18`, border: `1px solid ${tier.accent}30`, fontSize: '0.58rem', fontFamily: 'var(--mono)', fontWeight: 700, color: tier.accent }}>{`${tier.savePercent}% off`}</div>}
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: tier.accent, marginBottom: '8px', letterSpacing: '-0.01em' }}>{tier.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.035em', transition: `all 0.35s ${E}` }}>{price}</span>
                      {period && <span style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>{period}</span>}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--t3)', marginBottom: '22px', lineHeight: 1.5 }}>{tier.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px', flex: 1 }}>
                      {tier.features.map((f, fi) => (
                        <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.83rem', color: 'var(--t2)' }}>
                          <span style={{ color: tier.accent, fontSize: '0.7rem', flexShrink: 0, marginTop: '3px' }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                    <button onClick={onEnter} style={{ width: '100%', padding: '11px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', marginTop: 'auto', border: tier.popular ? 'none' : '1px solid var(--border2)', background: tier.popular ? `linear-gradient(135deg,${tier.accent},${tier.accent}cc)` : 'transparent', color: tier.popular ? '#fff' : 'var(--t2)', transition: `all 0.22s ${E}` }}
                      onMouseEnter={e => { if (!tier.popular) { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; } else { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 26px ${tier.accent}44`; } }}
                      onMouseLeave={e => { if (!tier.popular) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--t2)'; } else { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}>
                      {price === 'Free' ? 'Start Free' : 'Get Started'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="community" ref={quotes.ref} style={{ padding: '100px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px', opacity: quotes.vis ? 1 : 0, transform: quotes.vis ? 'none' : 'translateY(26px)', transition: `all 0.75s ${E}` }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px' }}>{'// community'}</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.8vw,2.4rem)', fontWeight: 700, letterSpacing: '-0.035em' }}>Built with obsessives, for obsessives.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
          {QUOTES.map((q, i) => (
            <div key={i} style={{ padding: '28px', borderRadius: '14px', background: 'var(--s2)', border: '1px solid var(--border)', position: 'relative', opacity: quotes.vis ? 1 : 0, transform: quotes.vis ? 'none' : 'translateY(26px)', transition: `all 0.65s ${E} ${i * 0.09}s`, cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 18px 52px rgba(0,0,0,0.38)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '3.5rem', fontWeight: 700, color: 'var(--accent)', opacity: 0.05, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: '0.96rem', color: 'var(--t1)', lineHeight: 1.68, marginBottom: '20px', fontStyle: 'italic', position: 'relative', zIndex: 1 }}>"{q.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${q.gradient[0]},${q.gradient[1]})`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--t1)' }}>{q.author}</div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--t4)' }}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={cta.ref} style={{ padding: '120px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.11) 0%,transparent 60%)', pointerEvents: 'none' }} />
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'absolute', top: ['18%', '62%', '42%'][i], left: ['6%', '88%', '50%'][i], width: ['100px', '60px', '80px'][i], height: ['100px', '60px', '80px'][i], borderRadius: i === 1 ? '50%' : '18px', border: '1px solid rgba(167,139,250,0.035)', animation: `plDrift ${22 + i * 9}s ease-in-out infinite`, pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto', opacity: cta.vis ? 1 : 0, transform: cta.vis ? 'none' : 'translateY(36px)', transition: `all 0.9s ${E}` }}>
          <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3.2rem)', fontWeight: 700, letterSpacing: '-0.038em', lineHeight: 1.08, marginBottom: '18px' }}>Ready to think<br /><span className="pl-shimmer">differently?</span></h2>
          <p style={{ color: 'var(--t2)', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: '500px', margin: '0 auto 38px' }}>Pulsar is in private beta. Request early access and shape the future of personal knowledge systems.</p>
          <div style={{ display: 'flex', gap: '0', maxWidth: '440px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(167,139,250,0.15)', background: 'var(--s2)', transition: 'border-color 0.3s,box-shadow 0.3s' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(167,139,250,0.14)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: '15px 18px', border: 'none', background: 'transparent', color: 'var(--t1)', fontSize: '0.95rem', fontFamily: 'var(--font)', outline: 'none' }} />
            <button onClick={onEnter} style={{ padding: '15px 28px', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', transition: `all 0.22s ${E}`, flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#c4b5fd,#a78bfa)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#a78bfa,#7c3aed)'; }}>Get Access</button>
          </div>
          <p style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--t4)', marginTop: '14px' }}>No spam. Early access for serious builders only.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#07070c', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Pulsar</span>
        </div>
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--t4)' }}>© 2025 Pulsar · Knowledge OS for the relentlessly curious</div>
        <div style={{ display: 'flex', gap: '22px' }}>
          {['Twitter', 'GitHub', 'Discord'].map(s => (
            <a key={s} href="#" style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', color: 'var(--t4)', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--t4)'; }}>{s}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
