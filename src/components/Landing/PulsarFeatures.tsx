// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react';
import LandingNav from '@/components/Landing/LandingNav'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.pf *{margin:0;padding:0;box-sizing:border-box}
.pf{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--s4:#222236;--bd:rgba(255,255,255,0.04);--bd2:rgba(255,255,255,0.08);--bd3:rgba(255,255,255,0.14);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ac2:#c4b5fd;--ac3:#7c3aed;--ok:#6ee7b7;--ft:'Space Grotesk',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;--ease:cubic-bezier(0.22,1,0.36,1);font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.pf ::-webkit-scrollbar{width:5px}.pf ::-webkit-scrollbar-track{background:transparent}.pf ::-webkit-scrollbar-thumb{background:rgba(167,139,250,.15);border-radius:3px}
.pf a{color:var(--ac);text-decoration:none}
@keyframes pfPulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes pfShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
.pf-shim{background:linear-gradient(90deg,#a78bfa,#e879f9 25%,#c4b5fd 50%,#818cf8 75%,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:pfShimmer 5s linear infinite}
@media(max-width:768px){
  .pf-section{padding-left:20px!important;padding-right:20px!important}
  .pf-pillar-row{flex-direction:column!important}
  .pf-pillar-sidebar{flex:none!important;position:static!important;width:100%!important}
  .pf-grid-2{grid-template-columns:1fr!important}
  .pf-showcase-inner{grid-template-columns:1fr!important}
  .pf-showcase-sidebar{display:none!important}
}
`;

const M = { bg: '#0c0c14', s1: '#111119', s2: '#18182a', s3: '#222236', bd: 'rgba(255,255,255,0.06)', t3: '#65657a', t4: '#45455a', mn: "'JetBrains Mono',monospace" };

function MockFrame({ children, color }) {
  return (
    <div style={{ marginTop: 14, borderRadius: 8, border: '1px solid ' + color + '15', background: M.bg, overflow: 'hidden', fontSize: 0 }}>
      <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '1px solid ' + M.bd }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', opacity: 0.5 }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', opacity: 0.5 }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', opacity: 0.5 }} />
      </div>
      <div style={{ padding: 12, fontSize: '0.7rem', fontFamily: M.mn, color: M.t3 }}>{children}</div>
    </div>
  );
}

function MiniChart({ vals, color }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
      {vals.map((v, i) => <div key={i} style={{ flex: 1, height: v + '%', borderRadius: '2px 2px 0 0', background: color + (v > 60 ? '60' : '30'), transition: 'height 0.4s ease' }} />)}
    </div>
  );
}

function MiniGraph({ color }) {
  return (
    <svg viewBox="0 0 100 70" style={{ width: '100%', height: 56 }}>
      <line x1="15" y1="20" x2="55" y2="10" stroke={color} strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
      <line x1="55" y1="10" x2="80" y2="35" stroke={color} strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
      <line x1="15" y1="20" x2="30" y2="55" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
      <line x1="30" y1="55" x2="65" y2="60" stroke="#fbbf24" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
      <line x1="65" y1="60" x2="80" y2="35" stroke="#f472b6" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
      {[{ x: 15, y: 20 }, { x: 55, y: 10 }, { x: 80, y: 35 }, { x: 30, y: 55 }, { x: 65, y: 60 }].map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={i === 0 ? 5 : 3.5} fill={[color, '#fbbf24', '#f472b6', '#6ee7b7', '#38bdf8'][i]} opacity={0.7} />)}
    </svg>
  );
}

function MiniKanban({ color }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {['Todo', 'Doing', 'Done'].map((col, ci) => (
        <div key={ci} style={{ borderRadius: 4, background: M.s2, padding: 6 }}>
          <div style={{ fontSize: '0.55rem', fontFamily: M.mn, color: M.t4, textTransform: 'uppercase', marginBottom: 5 }}>{col}</div>
          {Array.from({ length: ci === 1 ? 2 : ci === 2 ? 3 : 2 }).map((_, i) => (
            <div key={i} style={{ height: 10, borderRadius: 2, background: ci === 2 ? color + '20' : M.bd, marginBottom: 3 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniCalendar({ color }) {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const actives = [3, 5, 7, 8, 12, 14, 15, 19, 21, 22, 25];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
      {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ fontSize: '0.5rem', textAlign: 'center', color: M.t4 }}>{d}</div>)}
      {days.map(d => (
        <div key={d} style={{ width: '100%', aspectRatio: '1', borderRadius: 2, background: actives.includes(d) ? color + '25' : 'transparent', display: 'grid', placeItems: 'center' }}>
          <span style={{ fontSize: '0.5rem', color: actives.includes(d) ? color : M.t4 }}>{d}</span>
        </div>
      ))}
    </div>
  );
}

function MiniHabitGrid({ color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {['🏃','💧','🧘'].map((e, ri) => (
        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.65rem', width: 14 }}>{e}</span>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {Array.from({ length: 14 }).map((_, ci) => (
              <div key={ci} style={{ width: 8, height: 8, borderRadius: 2, background: ci % 3 !== 1 ? color + '40' : M.bd }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniEditor() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ height: 6, width: '70%', borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ height: 4, width: '100%', borderRadius: 2, background: M.bd }} />
      <div style={{ height: 4, width: '85%', borderRadius: 2, background: M.bd }} />
      <div style={{ height: 4, width: '92%', borderRadius: 2, background: M.bd }} />
      <div style={{ height: 4, width: '60%', borderRadius: 2, background: M.bd }} />
      <div style={{ height: 8 }} />
      <div style={{ height: 4, width: '100%', borderRadius: 2, background: M.bd }} />
      <div style={{ height: 4, width: '78%', borderRadius: 2, background: M.bd }} />
    </div>
  );
}

function MiniTree({ color }) {
  const items = [{ indent: 0, name: '📁 Biology' },{ indent: 1, name: '📄 Cell Mitosis' },{ indent: 1, name: '📄 DNA Replication' },{ indent: 0, name: '📁 Physics' },{ indent: 1, name: '📄 Fourier Transforms' }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((it, i) => <div key={i} style={{ paddingLeft: it.indent * 14, fontSize: '0.6rem', color: it.indent === 0 ? color : M.t3, fontFamily: M.mn }}>{it.name}</div>)}
    </div>
  );
}

function MiniChat() {
  const msgs = [{ name: 'K', msg: 'Updated the deadline', r: false },{ name: 'D', msg: 'Looks good ✓', r: false },{ name: 'You', msg: 'Merging now', r: true }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {msgs.map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: m.r ? 'flex-end' : 'flex-start', gap: 4, alignItems: 'center' }}>
          {!m.r && <div style={{ width: 12, height: 12, borderRadius: '50%', background: M.s3, display: 'grid', placeItems: 'center', fontSize: '0.4rem', color: M.t4 }}>{m.name}</div>}
          <div style={{ padding: '3px 7px', borderRadius: 4, background: m.r ? 'rgba(167,139,250,0.12)' : M.s2, fontSize: '0.55rem', color: M.t3 }}>{m.msg}</div>
        </div>
      ))}
    </div>
  );
}

function MiniProgress({ vals, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {vals.map((v, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: M.t4, marginBottom: 3 }}><span>{v.label}</span><span style={{ fontFamily: M.mn, color }}>{v.pct}%</span></div>
          <div style={{ height: 3, borderRadius: 2, background: M.bd, overflow: 'hidden' }}><div style={{ width: v.pct + '%', height: '100%', borderRadius: 2, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}

function MiniTags({ color }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {['#biology','#urgent','#research','#q3','#study'].map(t => (
        <span key={t} style={{ padding: '2px 6px', borderRadius: 3, background: color + '10', border: '1px solid ' + color + '20', fontSize: '0.55rem', fontFamily: M.mn, color }}>{t}</span>
      ))}
    </div>
  );
}

function getVisual(pillarColor, subName) {
  const c = pillarColor, n = subName.toLowerCase();
  if (n.includes('note')) return <MockFrame color={c}><MiniEditor /></MockFrame>;
  if (n.includes('topic') || n.includes('reference') || n.includes('vault')) return <MockFrame color={c}><MiniTree color={c} /></MockFrame>;
  if (n.includes('study') || n.includes('flash')) return (
    <MockFrame color={c}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: 6, borderRadius: 4, background: M.s2, fontSize: '0.6rem', color: '#a0a0b8' }}>Q: What is mitosis?</div>
        <div style={{ padding: 6, borderRadius: 4, background: c + '08', border: '1px solid ' + c + '15', fontSize: '0.6rem', color: c }}>A: Cell division producing two identical daughter cells</div>
      </div>
    </MockFrame>
  );
  if (n.includes('zettel') || n.includes('island') || n.includes('concept') || n.includes('graph') || n.includes('gap')) return <MockFrame color={c}><MiniGraph color={c} /></MockFrame>;
  if (n.includes('accelerat') || n.includes('bundle')) return <MockFrame color={c}><MiniProgress vals={[{ label: 'Diagrams', pct: 72 }, { label: 'Exercises', pct: 45 }, { label: 'Projects', pct: 20 }]} color={c} /></MockFrame>;
  if (n.includes('dynamic') || n.includes('learning path')) return (
    <MockFrame color={c}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {['Cell Bio','Genetics','Evolution'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ padding: '3px 8px', borderRadius: 4, background: i === 0 ? c + '20' : M.s2, fontSize: '0.55rem', color: i === 0 ? c : M.t4, border: '1px solid ' + (i === 0 ? c + '30' : M.bd) }}>{s}</div>
            {i < 2 && <span style={{ color: M.t4, fontSize: '0.5rem' }}>→</span>}
          </div>
        ))}
      </div>
    </MockFrame>
  );
  if (n.includes('task') || n.includes('todo') || n.includes('priorit')) return <MockFrame color={c}><MiniKanban color={c} /></MockFrame>;
  if (n.includes('calendar') || n.includes('schedule')) return <MockFrame color={c}><MiniCalendar color={c} /></MockFrame>;
  if (n.includes('habit')) return <MockFrame color={c}><MiniHabitGrid color={c} /></MockFrame>;
  if (n.includes('goal') || n.includes('analytics') || n.includes('subject') || n.includes('predict') || n.includes('cross-feature') || n.includes('team')) return <MockFrame color={c}><MiniChart vals={[30,55,70,45,80,65,90,50]} color={c} /></MockFrame>;
  if (n.includes('journal')) return (
    <MockFrame color={c}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: '0.55rem', fontFamily: M.mn, color: c }}>Mar 15, 2026</div>
        <div style={{ height: 4, width: '100%', borderRadius: 2, background: M.bd }} />
        <div style={{ height: 4, width: '80%', borderRadius: 2, background: M.bd }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>{['😊','⚡','🎯'].map(e => <span key={e} style={{ fontSize: '0.6rem' }}>{e}</span>)}</div>
      </div>
    </MockFrame>
  );
  if (n.includes('focus') || n.includes('pomodoro')) return (
    <MockFrame color={c}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontFamily: M.mn, fontWeight: 700, color: c, letterSpacing: '-1px' }}>23:47</div>
        <div style={{ fontSize: '0.5rem', color: M.t4, marginTop: 3 }}>deep work · session 3</div>
        <div style={{ height: 3, background: M.bd, marginTop: 6, overflow: 'hidden' }}><div style={{ width: '58%', height: '100%', background: c }} /></div>
      </div>
    </MockFrame>
  );
  if (n.includes('recommend') || n.includes('suggest') || n.includes('smart') || n.includes('adaptive')) return (
    <MockFrame color={c}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['Review overdue tasks (3)','Continue: Genetics Ch.4','Break into smaller steps'].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 5 }}><span style={{ color: c }}>✓</span><span style={{ fontSize: '0.55rem', color: '#a0a0b8' }}>{s}</span></div>
        ))}
      </div>
    </MockFrame>
  );
  if (n.includes('dashboard') || n.includes('pinned') || n.includes('command') || n.includes('homescreen') || n.includes('live block')) return (
    <MockFrame color={c}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {[{l:'Tasks',v:'12'},{l:'Streak',v:'7d'},{l:'Focus',v:'4.2h'},{l:'Notes',v:'34'}].map(s => (
          <div key={s.l} style={{ padding: 5, borderRadius: 3, background: M.s2, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: M.mn, color: c }}>{s.v}</div>
            <div style={{ fontSize: '0.45rem', color: M.t4, textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </MockFrame>
  );
  if (n.includes('theme') || n.includes('layout')) return (<MockFrame color={c}><div style={{ display: 'flex', gap: 5 }}>{['#a78bfa','#818cf8','#6ee7b7','#f472b6','#fbbf24'].map(clr => <div key={clr} style={{ width: 16, height: 16, borderRadius: 4, background: clr, opacity: 0.6 }} />)}</div></MockFrame>);
  if (n.includes('tag') || n.includes('filter')) return <MockFrame color={c}><MiniTags color={c} /></MockFrame>;
  if (n.includes('plugin') || n.includes('marketplace')) return (
    <MockFrame color={c}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['📈 Stock','🧬 Bio','🤖 ML'].map(pl => (
          <div key={pl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.55rem', color: '#a0a0b8' }}>{pl}</span>
            <span style={{ fontSize: '0.45rem', padding: '1px 5px', borderRadius: 3, background: c + '15', color: c }}>install</span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
  if (n.includes('offline')) return (<MockFrame color={c}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.55rem', color: '#6ee7b7' }}>✓ Offline mode active</div><div style={{ fontSize: '0.5rem', color: '#6ee7b7', marginTop: 2 }}>↻ Syncs on reconnect</div></div></MockFrame>);
  if (n.includes('project') || n.includes('board')) return <MockFrame color={c}><MiniKanban color={c} /></MockFrame>;
  if (n.includes('workspace') || n.includes('shared')) return (<MockFrame color={c}><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{['K','D','M'].map((u, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: [c,'#6ee7b7','#f472b6'][i], display: 'grid', placeItems: 'center', fontSize: '0.4rem', color: '#fff', fontWeight: 700 }}>{u}</div>)}<span style={{ fontSize: '0.5rem', color: '#6ee7b7' }}>● 3 online</span></div></MockFrame>);
  if (n.includes('real-time') || n.includes('editing')) return (<MockFrame color={c}><div style={{ position: 'relative' }}><MiniEditor /><div style={{ position: 'absolute', top: 8, right: 4, width: 2, height: 14, background: '#f472b6', borderRadius: 1, opacity: 0.6 }} /><div style={{ position: 'absolute', top: 22, right: 30, width: 2, height: 14, background: '#38bdf8', borderRadius: 1, opacity: 0.6 }} /></div></MockFrame>);
  if (n.includes('comment') || n.includes('thread') || n.includes('conversation') || n.includes('feedback')) return <MockFrame color={c}><MiniChat /></MockFrame>;
  if (n.includes('version') || n.includes('history')) return (<MockFrame color={c}><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{['v3 · 2m · You','v2 · 1h · Kira','v1 · 3h · Dante'].map((v, vi) => (<div key={vi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: vi === 0 ? c : M.t4, fontFamily: M.mn }}><span>{v}</span>{vi === 0 && <span style={{ color: '#6ee7b7' }}>current</span>}</div>))}</div></MockFrame>);
  if (n.includes('permission') || n.includes('role')) return (<MockFrame color={c}><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{[{u:'You',r:'Admin',clr:c},{u:'Kira',r:'Editor',clr:'#6ee7b7'},{u:'Dante',r:'Viewer',clr:M.t4}].map((pr, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem' }}><span style={{ color: '#a0a0b8' }}>{pr.u}</span><span style={{ color: pr.clr, padding: '1px 5px', background: pr.clr + '10' }}>{pr.r}</span></div>))}</div></MockFrame>);
  if (n.includes('import') || n.includes('export')) return (<MockFrame color={c}><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{['📄 notes.md','📊 tasks.csv','📋 report.pdf'].map(f => (<div key={f} style={{ display: 'flex', gap: 5, fontSize: '0.55rem', color: '#a0a0b8' }}><span>{f}</span><span style={{ marginLeft: 'auto', color: '#6ee7b7' }}>✓</span></div>))}</div></MockFrame>);
  if (n.includes('sync') || n.includes('cloud')) return (<MockFrame color={c}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.55rem', color: '#6ee7b7' }}>✓ Synced across 3 devices</div></div></MockFrame>);
  if (n.includes('api') || n.includes('webhook')) return (<MockFrame color={c}><div style={{ fontFamily: M.mn, fontSize: '0.5rem', color: M.t3, display: 'flex', flexDirection: 'column', gap: 2 }}><span><span style={{ color: '#6ee7b7' }}>POST</span> /api/v1/tasks</span><span><span style={{ color: '#38bdf8' }}>GET</span> /api/v1/notes</span><span style={{ color: M.t4 }}>// 100 req/min</span></div></MockFrame>);
  if (n.includes('source')) return (<MockFrame color={c}><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><div style={{ fontSize: '0.55rem', color: '#a0a0b8' }}>📄 research-paper.pdf</div><div style={{ padding: 4, borderRadius: 3, background: c + '08', fontSize: '0.5rem', color: c }}>AI: 3 key findings, 2 notes linked</div></div></MockFrame>);
  if (n.includes('cross-app') || n.includes('unif')) return (<MockFrame color={c}><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[{app:'Slack',msg:'2 mentions'},{app:'Cal',msg:'30m meeting'},{app:'Jira',msg:'PR merged'}].map(item => (<div key={item.app} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem' }}><span style={{ color: c }}>{item.app}</span><span style={{ color: '#a0a0b8' }}>{item.msg}</span></div>))}</div></MockFrame>);
  return <MockFrame color={c}><MiniChart vals={[40,60,50,75,65,80,55]} color={c} /></MockFrame>;
}

const PILLARS = [
  { num: '01', name: 'Corespace', icon: '🏠', color: '#a78bfa', tag: 'Your Command Center',
    desc: 'Starts empty, fills with your intent. Pull in live blocks, pin highlights, arrange your workflow on a spatial canvas. Always 1 click away.',
    subs: [
      { name: 'Live Blocks', desc: 'Embed updating widgets from Tasks, Notes, Analytics — they sync in real time.' },
      { name: 'Custom Layout', desc: 'Drag, drop, resize, group. Dashboard canvas meets phone home screen.' },
      { name: 'Pinned Shortcuts', desc: 'Quick links to any project, note, or dashboard across all pillars.' },
      { name: 'Multi-Homescreen', desc: 'Separate homescreens for work, study, personal — switch instantly.' },
      { name: 'Command Palette', desc: 'Keyboard-first launcher. Search, navigate, create — all from ⌘K.' },
    ] },
  { num: '02', name: 'Knowledge', icon: '📚', color: '#818cf8', tag: 'Think in Webs',
    desc: 'Notes, study sheets, concept maps, Zettelkasten islands, a reference vault, and AI gap detection. Your knowledge — captured, connected, alive.',
    subs: [
      { name: 'Notes', desc: 'Rich editor with file import, Type/Grid views, passive AI, real-time collab.' },
      { name: 'Topic Library', desc: 'Subject hierarchy with progress tracking and mastery percentage.' },
      { name: 'Study Sheets / Flashcards', desc: 'Q&A mode, flashcard toggle, mastery tracking per question.' },
      { name: 'Reference Vault', desc: 'Centralized docs, PDFs, links — inline preview, cross-linking.' },
      { name: 'Zettelkasten / Islands', desc: 'Graph view with bidirectional links, node clustering, importance indicators.' },
      { name: 'Concept Maps', desc: 'Spatial canvas — draw connections, label relationships, collaborate.' },
      { name: 'Knowledge Graph', desc: 'Color-coded nodes, hover previews, analytics on link density.' },
      { name: 'Accelerator Bundles', desc: 'Domain kits (Biology, Stocks, Robotics) with exercises and methods.' },
      { name: 'AI Gap Detection', desc: 'Silently scans for missing connections and underexplored concepts.' },
      { name: 'Dynamic Learning Paths', desc: 'AI surfaces the next logical topic based on progress.' },
    ] },
  { num: '03', name: 'Productivity', icon: '⏱️', color: '#6ee7b7', tag: 'Deep Work Engine',
    desc: 'Tasks, calendar, habits, goals, journal, focus modes, and AI prioritization. Psychology-informed tools that move you forward.',
    subs: [
      { name: 'Tasks / To-Dos', desc: 'Quick-add, Kanban + list, subtasks, priorities, deadline reminders.' },
      { name: 'Calendar / Schedule', desc: 'Month/week/day/agenda views. Drag-to-reschedule, recurring events.' },
      { name: 'Habit Tracker', desc: 'Monthly grid, streaks, heatmaps, category-based completion analytics.' },
      { name: 'Goal Tracking', desc: 'Hierarchical goals → sub-goals → key results. Progress bars, alerts.' },
      { name: 'Journal', desc: 'Daily/weekly entries, mood indicators, reflection prompts, timeline view.' },
      { name: 'Focus Sessions / Pomodoro', desc: 'Deep work blocks, commitment mechanics, workspace simplification.' },
      { name: 'Smart Prioritization', desc: 'AI highlights overdue/high-priority tasks. Auto-scheduling suggestions.' },
      { name: 'Adaptive Recommendations', desc: 'AI notices patterns and suggests breaking habits into smaller steps.' },
    ] },
  { num: '04', name: 'Customization', icon: '⚙️', color: '#f472b6', tag: 'Your Rules',
    desc: 'Dashboards, themes, tags, filters, plugins, adaptive UI. Build the system that matches your brain.',
    subs: [
      { name: 'Customizable Dashboards', desc: 'Drag-and-drop widgets, modular sections, saved views per context.' },
      { name: 'Themes & Layouts', desc: 'Light/dark, accent colors, layout presets. Grid/list/mixed views.' },
      { name: 'Tags & Filters', desc: 'Hierarchical tags, AND/OR filters, saved filter views, cross-linking.' },
      { name: 'User Plugins / Marketplace', desc: 'Create and share tools, templates, algorithms. Community-driven.' },
      { name: 'Adaptive UI', desc: 'AI tracks usage and suggests layout optimizations. Surfaces top features.' },
      { name: 'Offline Mode', desc: 'Full read/edit offline. Auto-sync on reconnect. Conflict resolution.' },
    ] },
  { num: '05', name: 'Collaboration', icon: '🤝', color: '#38bdf8', tag: 'Shared Minds',
    desc: 'Projects, shared workspaces, real-time editing, threaded discussions, version history, granular permissions.',
    subs: [
      { name: 'Projects / Boards', desc: 'Kanban + list, flexible stages, auto progress %, deadline tracking.' },
      { name: 'Shared Workspaces', desc: 'Nested team spaces, customizable permissions, cross-workspace linking.' },
      { name: 'Real-time Editing', desc: 'Multi-user with colored cursors, instant sync, conflict-free merges.' },
      { name: 'Commenting & Feedback', desc: 'Inline annotations, threaded replies, @mentions, resolve actions.' },
      { name: 'Version History', desc: 'Auto snapshots, visual diff, one-click revert, selective restore.' },
      { name: 'Permissions & Roles', desc: 'Admin/Editor/Viewer with per-feature granularity and audit logs.' },
      { name: 'Threaded Conversations', desc: 'Discussions linked to tasks and notes — context never lost.' },
    ] },
  { num: '06', name: 'Analytics', icon: '📊', color: '#fbbf24', tag: 'Pattern Intelligence',
    desc: 'Progress analytics, subject breakdowns, smart suggestions, predictive insights, cross-feature analysis.',
    subs: [
      { name: 'Progress Analytics', desc: 'Aggregated task/project/learning progress. Graphs, heatmaps, rates.' },
      { name: 'Subject Breakdown', desc: 'Visual work distribution across topics. Coverage highlighting.' },
      { name: 'Smart Suggestions', desc: 'Context-aware next actions based on tasks, gaps, and priorities.' },
      { name: 'Predictive Insights', desc: 'AI flags at-risk deadlines, stalled projects, recurring delays.' },
      { name: 'Cross-Feature Analytics', desc: 'Unified view: tasks → notes → goals → habits correlations.' },
      { name: 'Team Analytics', desc: 'Collective performance, contribution tracking, bottleneck detection.' },
    ] },
  { num: '07', name: 'Extensions', icon: '🔌', color: '#f97316', tag: 'Infinite Reach',
    desc: 'Import/export, cloud sync, APIs, AI source integration, cross-app unification, dynamic marketplace.',
    subs: [
      { name: 'Import / Export', desc: 'Markdown, PDF, CSV, ZIP. Bulk import with auto-tagging.' },
      { name: 'Cloud Sync', desc: 'Multi-device real-time sync, 7-day history, daily auto-backup.' },
      { name: 'Third-Party APIs', desc: 'Public endpoints, webhooks, pre-built Slack/Calendar templates.' },
      { name: 'AI Source Integration', desc: 'Pull in PDFs/articles/videos. Auto-summarize, cross-reference.' },
      { name: 'Cross-App Unification', desc: 'Aggregate from Slack, Notion, Jira, Calendar in one feed.' },
      { name: 'Dynamic Marketplace', desc: 'Create, share, install tools/templates. Community ecosystem.' },
    ] },
];

const AI_TIERS = [
  { name: 'Base', color: '#a78bfa', desc: 'AI runs silently — organizing, surfacing connections, reducing friction without intervention.' },
  { name: 'Intermediate', color: '#818cf8', desc: 'AI becomes proactive — suggesting actions, prioritizing tasks, generating summaries, personalizing workflows.' },
  { name: 'Advanced', color: '#6ee7b7', desc: 'AI evolves into a collaborator — forecasting outcomes, cross-referencing domains, enabling predictive execution.' },
];

const AUDIENCE = [
  { icon: '🎓', label: 'Students', desc: 'Balance learning with execution across every subject.' },
  { icon: '💼', label: 'Professionals', desc: 'Manage projects across domains without tool-hopping.' },
  { icon: '🚀', label: 'Creators & Founders', desc: 'Turn scattered ideas into shipped products.' },
  { icon: '📖', label: 'Lifelong Learners', desc: 'Make knowledge drive momentum, not just accumulate.' },
];

function useReveal(th = 0.06) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: th });
    o.observe(el);
    return () => o.disconnect();
  }, [th]);
  return { ref, v };
}

function PillarSection({ pillar, index }) {
  const reveal = useReveal(0.04);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? pillar.subs : pillar.subs.slice(0, 4);
  const hasMore = pillar.subs.length > 4;
  return (
    <section ref={reveal.ref} id={pillar.name.toLowerCase()} className="pf-section" style={{ padding: '80px 40px', borderBottom: '1px solid var(--bd)', maxWidth: 1200, margin: '0 auto' }}>
      <div className="pf-pillar-row" style={{ display: 'flex', gap: 48, flexDirection: index % 2 ? 'row-reverse' : 'row' }}>
        <div className="pf-pillar-sidebar" style={{ flex: '0 0 300px', position: 'sticky', top: 100, opacity: reveal.v ? 1 : 0, transform: reveal.v ? 'none' : 'translateY(24px)', transition: 'all 0.7s var(--ease)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: '1.8rem' }}>{pillar.icon}</span>
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mn)', fontWeight: 600, color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{pillar.num} — {pillar.tag}</div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{pillar.name}</h2>
            </div>
          </div>
          <p style={{ fontSize: '0.98rem', color: 'var(--t2)', lineHeight: 1.65, marginBottom: 20 }}>{pillar.desc}</p>
          <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--s3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', borderRadius: 2, background: 'linear-gradient(90deg, ' + pillar.color + ', transparent)', opacity: 0.4 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="pf-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {shown.map((sub, si) => (
              <div key={si}
                style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--s1)', border: '1px solid var(--bd2)', transition: 'all 0.25s var(--ease)', opacity: reveal.v ? 1 : 0, transform: reveal.v ? 'none' : 'translateY(16px)', transitionDelay: (si * 0.03) + 's' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = pillar.color + '30'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 4 }}>{sub.name}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--t3)', lineHeight: 1.5 }}>{sub.desc}</p>
                {getVisual(pillar.color, sub.name)}
              </div>
            ))}
          </div>
          {hasMore && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ marginTop: 14, padding: '8px 18px', borderRadius: 8, border: '1px solid var(--bd2)', background: 'transparent', color: pillar.color, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ft)', transition: 'all 0.2s var(--ease)' }}
              onMouseEnter={e => { e.currentTarget.style.background = pillar.color + '08'; e.currentTarget.style.borderColor = pillar.color + '25'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--bd2)'; }}
            >{expanded ? '↑ Show less' : '+ ' + (pillar.subs.length - 4) + ' more features'}</button>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PulsarFeatures() {
  const hero = useReveal(0.05), problem = useReveal(0.08), ai = useReveal(0.08), audience = useReveal(0.08);
  useEffect(() => { if (!document.getElementById('pf-css')) { const s = document.createElement('style'); s.id = 'pf-css'; s.textContent = CSS; document.head.appendChild(s); } }, []);
  return (
    <div className="pf">
      <LandingNav />
      <section ref={hero.ref} style={{ padding: '100px 40px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }} className="pf-section">
        <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', opacity: hero.v ? 1 : 0, transform: hero.v ? 'none' : 'translateY(28px)', transition: 'all 0.8s var(--ease)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)', marginBottom: 28, fontSize: '0.75rem', fontFamily: 'var(--mn)', color: 'var(--t3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', animation: 'pfPulse 2s ease infinite' }} />7 pillars · 60+ features · 1 system
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.08, marginBottom: 20 }}>Everything you need.<br /><span className="pf-shim">Nothing you don't.</span></h1>
          <p style={{ fontSize: '1.12rem', color: 'var(--t2)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto' }}>Pulsar unites productivity, learning, and action into a single ecosystem — powered by adaptive AI.</p>
        </div>
      </section>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '0 40px 60px', flexWrap: 'wrap' }}>
        {PILLARS.map(pl => (
          <a key={pl.name} href={'#' + pl.name.toLowerCase()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1px solid var(--bd2)', background: 'var(--s1)', color: 'var(--t3)', fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s var(--ease)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = pl.color + '30'; e.currentTarget.style.color = pl.color; e.currentTarget.style.background = pl.color + '08'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'var(--s1)'; }}
          ><span>{pl.icon}</span>{pl.name}</a>
        ))}
      </div>
      <section ref={problem.ref} className="pf-section" style={{ padding: '80px 40px', background: 'var(--s1)', borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', opacity: problem.v ? 1 : 0, transform: problem.v ? 'none' : 'translateY(24px)', transition: 'all 0.7s var(--ease)' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>// the_problem</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>The knowledge gap is <span style={{ color: '#ef4444' }}>killing your potential</span>.</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 32 }}>We define <strong style={{ color: 'var(--t1)' }}>dead knowledge</strong> as the gap between knowing and doing. Existing tools make it worse:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[{ tool: 'Notion', issue: 'Users spend more time designing systems than taking action. Workflows scale until productivity stalls.' },
              { tool: 'Obsidian', issue: 'Too complex for mainstream adoption. Knowledge stays in vaults, never reaching execution.' },
              { tool: 'Google', issue: 'Infinite information, zero structure. No system to contextualize, connect, or act.' }].map((item, i) => (
              <div key={i} style={{ padding: '22px', borderRadius: 12, background: 'var(--s2)', border: '1px solid var(--bd2)', opacity: problem.v ? 1 : 0, transform: problem.v ? 'none' : 'translateY(12px)', transition: 'all 0.5s var(--ease) ' + (i * 0.06) + 's' }}>
                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--t4)', marginBottom: 8 }}>{item.tool}</div>
                <p style={{ fontSize: '0.92rem', color: 'var(--t3)', lineHeight: 1.55 }}>{item.issue}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {PILLARS.map((pl, i) => <PillarSection key={pl.name} pillar={pl} index={i} />)}
      <section ref={ai.ref} style={{ padding: '100px 40px', background: 'var(--s1)', borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52, opacity: ai.v ? 1 : 0, transform: ai.v ? 'none' : 'translateY(20px)', transition: 'all 0.7s var(--ease)' }}>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>// ai_engine</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>AI that grows with you.</h2>
            <p style={{ color: 'var(--t2)', fontSize: '1rem', marginTop: 14, lineHeight: 1.6 }}>Invisible at first. Indispensable over time.</p>
          </div>
          <div style={{ position: 'relative', paddingLeft: 48 }}>
            <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--s3)' }} />
            {AI_TIERS.map((t, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: i < 2 ? 40 : 0, opacity: ai.v ? 1 : 0, transform: ai.v ? 'none' : 'translateY(16px)', transition: 'all 0.6s var(--ease) ' + (i * 0.1) + 's' }}>
                <div style={{ position: 'absolute', left: -35, top: 4, width: 16, height: 16, borderRadius: '50%', background: t.color, boxShadow: '0 0 16px ' + t.color + '40' }} />
                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--mn)', fontWeight: 600, color: t.color, marginBottom: 6 }}>{t.name}</div>
                <p style={{ fontSize: '1rem', color: 'var(--t2)', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section ref={audience.ref} style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48, opacity: audience.v ? 1 : 0, transform: audience.v ? 'none' : 'translateY(20px)', transition: 'all 0.7s var(--ease)' }}>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', fontWeight: 600, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>// built_for</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>Designed for every knowledge worker.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {AUDIENCE.map((a, i) => (
              <div key={i} style={{ padding: '28px 22px', borderRadius: 14, background: 'var(--s1)', border: '1px solid var(--bd2)', textAlign: 'center', transition: 'all 0.25s var(--ease)', opacity: audience.v ? 1 : 0, transform: audience.v ? 'none' : 'translateY(16px)', transitionDelay: (i * 0.06) + 's' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--bd3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--bd2)'; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 14 }}>{a.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{a.label}</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--t3)', lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: '100px 40px', textAlign: 'center', borderTop: '1px solid var(--bd)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16 }}>Ready to <span className="pf-shim">activate</span> your knowledge?</h2>
          <p style={{ color: 'var(--t2)', fontSize: '1.05rem', marginBottom: 32 }}>Start your journey. Seven pillars from day one.</p>
          <a href="/sign-up" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 10, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontSize: '1rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s var(--ease)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(167,139,250,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >Get Started →</a>
        </div>
      </section>
      <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Pulsar</span>
        </div>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--mn)', color: 'var(--t4)' }}>© 2025 Pulsar. The knowledge OS for the relentlessly curious.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Twitter','GitHub','Discord'].map(s => (
            <a key={s} href="#" style={{ fontSize: '0.78rem', fontFamily: 'var(--mn)', color: 'var(--t4)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--t4)'; }}
            >{s}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
