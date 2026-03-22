import { useState, useRef, useCallback, useMemo } from 'react';
import styles from './ProjectBoards.module.scss';
import {
  T, NODE_TYPES, STATUS_META, BOARD_PALETTE, BOARD_ICONS,
  CANVAS_DEFAULTS, SEED_BOARDS, nextNodeId, nextThreadId, curvePath,
} from '@/constants/projectBoards';
import type {
  Board, BoardNode, BoardThread, ResolvedThread,
  DragState, PanState, BoardStats,
} from '@/types/projectBoards';

declare module 'react' {
  interface CSSProperties {
    '--bc'?: string;
  }
}

// ─── NODE CARD ───────────────────────────────────────────
interface NodeCardProps {
  node:     BoardNode;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onSelect:    (id: string) => void;
  onUpdate:    (n: BoardNode) => void;
}

function NodeCard({ node, selected, onMouseDown, onTouchStart, onSelect, onUpdate }: NodeCardProps) {
  const nt = NODE_TYPES[node.type];
  const sm = STATUS_META[node.status];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState({ title: node.title, body: node.body });
  const inp = useRef<HTMLInputElement>(null);

  const commit = () => {
    onUpdate({ ...node, ...draft });
    setEditing(false);
  };

  return (
    <div
      data-node="1"
      className={`${styles.node}${selected ? ` ${styles.selected}` : ''}`}
      style={{ left: node.x, top: node.y }}
      onMouseDown={e => { e.stopPropagation(); onMouseDown(e, node.id); onSelect(node.id); }}
      onTouchStart={e => { e.stopPropagation(); onTouchStart(e, node.id); onSelect(node.id); }}
      onDoubleClick={e => { e.stopPropagation(); setEditing(true); setTimeout(() => inp.current?.focus(), 0); }}
    >
      <div className={styles.nodeAccent} style={{ background: nt.c }} />

      <div className={styles.nodeBody}>
        {/* header row */}
        <div className={styles.nodeHeader}>
          <span
            className={styles.nodeTypeBadge}
            style={{ color: nt.c, background: `${nt.c}18` }}
          >
            {nt.label}
          </span>
          <span className={styles.nodeStatus} style={{ color: sm.c }}>
            <span className={styles.nodeStatusDot} style={{ background: sm.c }} />
            {sm.label}
          </span>
        </div>

        {/* title */}
        {editing ? (
          <input
            ref={inp}
            className={styles.nodeTitleInput}
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setEditing(false); setDraft({ title: node.title, body: node.body }); }
            }}
          />
        ) : (
          <div className={styles.nodeTitle}>{node.title}</div>
        )}

        {/* body */}
        {editing ? (
          <textarea
            className={styles.nodeBodyInput}
            value={draft.body}
            rows={2}
            onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
            onBlur={commit}
          />
        ) : node.body ? (
          <div className={styles['nodeBody_']}>{node.body}</div>
        ) : null}
      </div>
    </div>
  );
}

// ─── CANVAS VIEW ─────────────────────────────────────────
interface CanvasProps {
  board:    Board;
  onBack:   () => void;
  onUpdate: (b: Board) => void;
}

function BoardCanvas({ board, onBack, onUpdate }: CanvasProps) {
  const [nodes,    setNodes]    = useState<BoardNode[]>(board.nodes);
  const [threads,  setThreads]  = useState<BoardThread[]>(board.threads);
  const [sel,      setSel]      = useState<string | null>(null);
  const [pan,      setPan]      = useState<PanState>({ x: CANVAS_DEFAULTS.panX, y: CANVAS_DEFAULTS.panY });
  const [scale,    setScale]    = useState<number>(CANVAS_DEFAULTS.scale);
  const [drag,     setDrag]     = useState<DragState | null>(null);
  const [panning,  setPanning]  = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [addPt,    setAddPt]    = useState<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const [cnMode,   setCnMode]   = useState(false);
  const [cnFrom,   setCnFrom]   = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // sync to parent on change
  const prevStr = useRef('');
  const stateStr = JSON.stringify({ nodes, threads });
  if (prevStr.current !== stateStr) {
    prevStr.current = stateStr;
    onUpdate({ ...board, nodes, threads });
  }

  const s2c = useCallback((sx: number, sy: number) => {
    const r = wrapRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { x: (sx - r.left - pan.x) / scale, y: (sy - r.top - pan.y) / scale };
  }, [pan, scale]);

  const onWrapMD = (e: React.MouseEvent) => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-node]') || tgt.closest('[data-menu]')) return;
    setPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSel(null);
    setAddPt(null);
  };

  const onMM = useCallback((e: React.MouseEvent) => {
    if (panning && panStart) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    if (drag) {
      const cp = s2c(e.clientX, e.clientY);
      setNodes(p => p.map(n =>
        n.id === drag.id
          ? { ...n,
              x: Math.round((cp.x - drag.ox) / CANVAS_DEFAULTS.snapSz) * CANVAS_DEFAULTS.snapSz,
              y: Math.round((cp.y - drag.oy) / CANVAS_DEFAULTS.snapSz) * CANVAS_DEFAULTS.snapSz }
          : n
      ));
    }
  }, [panning, panStart, drag, s2c]);

  const onMU = () => { setPanning(false); setPanStart(null); setDrag(null); };

  /* ── Touch handlers (mirror mouse handlers for mobile) ── */
  const onTouchStartWrap = (e: React.TouchEvent) => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-node]') || tgt.closest('[data-menu]')) return;
    const t = e.touches[0];
    setPanning(true);
    setPanStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
    setSel(null);
    setAddPt(null);
  };

  const onTouchMoveWrap = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (panning && panStart) setPan({ x: t.clientX - panStart.x, y: t.clientY - panStart.y });
    if (drag) {
      const cp = s2c(t.clientX, t.clientY);
      setNodes(p => p.map(n =>
        n.id === drag.id
          ? { ...n,
              x: Math.round((cp.x - drag.ox) / CANVAS_DEFAULTS.snapSz) * CANVAS_DEFAULTS.snapSz,
              y: Math.round((cp.y - drag.oy) / CANVAS_DEFAULTS.snapSz) * CANVAS_DEFAULTS.snapSz }
          : n
      ));
    }
  }, [panning, panStart, drag, s2c]);

  const onTouchEndWrap = () => { setPanning(false); setPanStart(null); setDrag(null); };

  const onNodeTouchStart = (e: React.TouchEvent, id: string) => {
    if (cnMode) {
      if (!cnFrom) { setCnFrom(id); return; }
      if (cnFrom !== id && !threads.some(t =>
        (t.from === cnFrom && t.to === id) || (t.from === id && t.to === cnFrom)
      )) {
        setThreads(p => [...p, { id: nextThreadId(), from: cnFrom, to: id, label: '' }]);
      }
      setCnFrom(null);
      return;
    }
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    const t = e.touches[0];
    const cp = s2c(t.clientX, t.clientY);
    setDrag({ id, ox: cp.x - n.x, oy: cp.y - n.y });
  };

  const onNodeMD = (e: React.MouseEvent, id: string) => {
    if (cnMode) {
      if (!cnFrom) { setCnFrom(id); return; }
      if (cnFrom !== id && !threads.some(t =>
        (t.from === cnFrom && t.to === id) || (t.from === id && t.to === cnFrom)
      )) {
        setThreads(p => [...p, { id: nextThreadId(), from: cnFrom, to: id, label: '' }]);
      }
      setCnFrom(null);
      return;
    }
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    const cp = s2c(e.clientX, e.clientY);
    setDrag({ id, ox: cp.x - n.x, oy: cp.y - n.y });
  };

  const onDblClick = (e: React.MouseEvent) => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-node]')) return;
    const cp = s2c(e.clientX, e.clientY);
    const r  = wrapRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setAddPt({ ...cp, sx: e.clientX - r.left, sy: e.clientY - r.top });
  };

  const addNode = (type: BoardNode['type']) => {
    if (!addPt) return;
    const nn: BoardNode = {
      id: nextNodeId(), type,
      title: 'New ' + NODE_TYPES[type].label,
      body: '',
      x: Math.round((addPt.x - CANVAS_DEFAULTS.nodeW / 2) / CANVAS_DEFAULTS.snapSz) * CANVAS_DEFAULTS.snapSz,
      y: Math.round((addPt.y - 50) / CANVAS_DEFAULTS.snapSz) * CANVAS_DEFAULTS.snapSz,
      status: 'todo', priority: 'medium',
    };
    setNodes(p => [...p, nn]);
    setSel(nn.id);
    setAddPt(null);
  };

  const delSel = useCallback(() => {
    if (!sel) return;
    setNodes(p => p.filter(n => n.id !== sel));
    setThreads(p => p.filter(t => t.from !== sel && t.to !== sel));
    setSel(null);
  }, [sel]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) delSel();
    if (e.key === 'Escape') { setSel(null); setAddPt(null); setCnMode(false); setCnFrom(null); }
  }, [sel, delSel]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const f = e.deltaY > 0 ? 0.92 : 1.08;
    setScale(s => Math.max(0.25, Math.min(2.5, s * f)));
  };

  // derived stats
  const stats = useMemo<BoardStats>(() => {
    const total   = nodes.length;
    const done    = nodes.filter(n => n.status === 'done').length;
    const ip      = nodes.filter(n => n.status === 'inprogress').length;
    const blocked = nodes.filter(n => n.status === 'blocked').length;
    const todo    = nodes.filter(n => n.status === 'todo').length;
    return { total, done, ip, blocked, todo, threads: threads.length, pct: total > 0 ? Math.round(done / total * 100) : 0 };
  }, [nodes, threads]);

  // resolved threads for SVG
  const tdData = useMemo<ResolvedThread[]>(() =>
    threads.map(th => {
      const a = nodes.find(n => n.id === th.from);
      const b = nodes.find(n => n.id === th.to);
      if (!a || !b) return null;
      const ax = a.x + CANVAS_DEFAULTS.nodeW / 2, ay = a.y + CANVAS_DEFAULTS.nodeHC;
      const bx = b.x + CANVAS_DEFAULTS.nodeW / 2, by = b.y + CANVAS_DEFAULTS.nodeHC;
      return { ...th, ax, ay, bx, by, path: curvePath(ax, ay, bx, by), mx: (ax + bx) / 2, my: (ay + by) / 2 };
    }).filter((x): x is ResolvedThread => x !== null),
    [nodes, threads]
  );

  const wrapClass = [
    styles.canvasWrap,
    panning  ? styles.grabbing  : '',
    cnMode   ? styles.crosshair : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.canvasView} tabIndex={0} onKeyDown={onKey}>

      {/* ── TOP BAR ── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="8,2 3,6.5 8,11" />
          </svg>
          Boards
        </button>

        <div className={styles.divider} />
        <span className={styles.boardIcon}>{board.icon}</span>
        <span className={styles.boardName}>{board.name}</span>

        {/* ── METRICS ── */}
        <div className={styles.metrics}>
          {([
            { label: 'Done',    val: stats.done,    c: T.gr },
            { label: 'Active',  val: stats.ip,      c: T.ac },
            { label: 'Blocked', val: stats.blocked, c: T.re },
            { label: 'Todo',    val: stats.todo,    c: T.t3 },
          ] as const).map(({ label, val, c }) => (
            <div key={label} className={styles.metricPill}
              style={{ background: `${c}12`, borderColor: `${c}28` }}>
              <span className={styles.metricVal}   style={{ color: c }}>{val}</span>
              <span className={styles.metricLabel} style={{ color: c }}>{label}</span>
            </div>
          ))}

          <div className={styles.progressPill}>
            <div className={styles.progressBar}>
              <div className={styles.progressBarFill} style={{ width: `${stats.pct}%` }} />
            </div>
            <span className={`${styles.progressPct}${stats.pct === 100 ? ` ${styles.complete}` : ''}`}>
              {stats.pct}%
            </span>
          </div>

          <div className={styles.divider} style={{ margin: '0 4px' }} />

          <button
            className={`${styles.toolBtn}${cnMode ? ` ${styles.active}` : ''}`}
            onClick={() => { setCnMode(c => !c); setCnFrom(null); }}
          >
            {cnMode ? (cnFrom ? '→ pick target' : 'pick source') : 'Connect'}
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => { setPan({ x: CANVAS_DEFAULTS.panX, y: CANVAS_DEFAULTS.panY }); setScale(CANVAS_DEFAULTS.scale); }}
          >
            Center
          </button>
        </div>
      </div>

      {/* ── CANVAS WRAP ── */}
      <div
        ref={wrapRef}
        className={wrapClass}
        onMouseDown={onWrapMD}
        onMouseMove={onMM}
        onMouseUp={onMU}
        onMouseLeave={onMU}
        onTouchStart={onTouchStartWrap}
        onTouchMove={onTouchMoveWrap}
        onTouchEnd={onTouchEndWrap}
        onDoubleClick={onDblClick}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
      >
        {/* dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern
              id="pb-dots"
              width={CANVAS_DEFAULTS.gridSz * scale}
              height={CANVAS_DEFAULTS.gridSz * scale}
              patternUnits="userSpaceOnUse"
              x={pan.x % (CANVAS_DEFAULTS.gridSz * scale)}
              y={pan.y % (CANVAS_DEFAULTS.gridSz * scale)}
            >
              <circle cx={0.5} cy={0.5} r={0.9} fill={T.b} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pb-dots)" />
        </svg>

        {/* transformed stage */}
        <div style={{
          position: 'absolute', transformOrigin: '0 0',
          transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
        }}>
          {/* threads SVG */}
          <svg style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}>
            {tdData.map(td => (
              <g key={td.id}>
                <path d={td.path} fill="none" stroke={T.b2} strokeWidth={1.5} strokeDasharray="6 3" opacity={0.8} />
                <circle cx={td.bx} cy={td.by} r={3.5} fill={T.b2} opacity={0.8} />
                {td.label && (
                  <>
                    <rect x={td.mx - 22} y={td.my - 9} width={44} height={16} rx={4}
                      fill={T.card} stroke={T.b} strokeWidth={1} />
                    <text x={td.mx} y={td.my + 4} textAnchor="middle"
                      style={{ fontSize: 9, fill: T.t3, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      {td.label}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>

          {/* nodes */}
          {nodes.map(n => (
            <NodeCard
              key={n.id}
              node={n}
              selected={sel === n.id}
              onMouseDown={onNodeMD}
              onTouchStart={onNodeTouchStart}
              onSelect={setSel}
              onUpdate={updated => setNodes(p => p.map(x => x.id === updated.id ? updated : x))}
            />
          ))}
        </div>

        {/* add node menu */}
        {addPt && (
            <div data-menu="1" className={styles.addMenu} style={{ left: addPt.sx, top: addPt.sy }}
              onClick={e => e.stopPropagation()}>
              <div className={styles.addMenuLabel}>Add Node</div>
              {(Object.keys(NODE_TYPES) as BoardNode['type'][]).map(k => (
                <button key={k} className={styles.addMenuBtn} onClick={() => addNode(k)}>
                  <span className={styles.addMenuDot} style={{ background: NODE_TYPES[k].c }} />
                  {NODE_TYPES[k].label}
                </button>
              ))}
              <div className={styles.addMenuDivider} />
              <button className={styles.addMenuCancel} onClick={() => setAddPt(null)}>Cancel</button>
            </div>
        )}

        {/* empty hint */}
        {nodes.length === 0 && (
          <div className={styles.canvasHint}>
            Double-click to add a node
            <span className={styles.canvasHintSub}>Drag to pan · Scroll to zoom · Del to remove</span>
          </div>
        )}

        {/* zoom controls */}
        <div className={styles.zoomControls}>
          {([
            ['−', () => setScale(s => Math.max(0.25, s * 0.85))],
            [`${Math.round(scale * 100)}%`, () => setScale(CANVAS_DEFAULTS.scale)],
            ['+', () => setScale(s => Math.min(2.5, s * 1.15))],
          ] as [string, () => void][]).map(([l, a]) => (
            <button key={l} className={`${styles.zoomBtn}${l.includes('%') ? ` ${styles.zoomLabel}` : ''}`} onClick={a}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HOME DATA ───────────────────────────────────────────
const DEMO_COLLAB = [
  { name: 'Alex Chen',   role: 'Designer',  avatar: 'AC', active: true  },
  { name: 'Maya Patel',  role: 'Engineer',  avatar: 'MP', active: true  },
  { name: 'Jordan Lee',  role: 'PM',        avatar: 'JL', active: false },
  { name: 'Sam Torres',  role: 'Engineer',  avatar: 'ST', active: false },
];

const DEMO_ACTIVITY = [
  { action: 'Maya added a node to',    board: 'Q2 Sprint',     time: '2m ago'  },
  { action: 'Alex connected nodes in', board: 'Design System', time: '18m ago' },
  { action: 'Jordan created board',    board: 'Roadmap 2026',  time: '1h ago'  },
  { action: 'Sam completed task in',   board: 'Q2 Sprint',     time: '3h ago'  },
  { action: 'Maya updated status in',  board: 'Design System', time: '5h ago'  },
];

// ─── HOME ────────────────────────────────────────────────
interface HomeProps {
  boards: Board[];
  onOpen: (id: string) => void;
  onNew:  () => void;
}

function Home({ boards, onOpen, onNew }: HomeProps) {
  return (
    <div className={styles.home}>

      {/* Header */}
      <div className={styles.homeHeader}>
        <div>
          <div className={styles.homeBreadcrumb}>Pulsar / Productivity</div>
          <h1 className={styles.homeTitle}>Project Boards</h1>
        </div>
        <button className={styles.newBtn} onClick={onNew}>
          <span className={styles.newBtnPlus}>+</span>New Board
        </button>
      </div>

      {/* Two-column layout */}
      <div className={styles.homeLayout}>

        {/* Boards pane */}
        <div className={styles.boardsPane}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Boards</span>
            <span className={styles.sectionCount}>{boards.length}</span>
          </div>
          <div className={styles.grid}>
          {boards.map((b, i) => {
            const done    = b.nodes.filter(n => n.status === 'done').length;
            const ip      = b.nodes.filter(n => n.status === 'inprogress').length;
            const blocked = b.nodes.filter(n => n.status === 'blocked').length;
            const todo    = b.nodes.filter(n => n.status === 'todo').length;
            const total   = b.nodes.length;
            const pct     = total > 0 ? Math.round(done / total * 100) : 0;
            const R = 20, circ = 2 * Math.PI * R;
            const byType = (Object.keys(NODE_TYPES) as BoardNode['type'][])
              .map(k => ({ k, count: b.nodes.filter(n => n.type === k).length, c: NODE_TYPES[k].c }))
              .filter(x => x.count > 0);

            return (
              <div
                key={b.id}
                className={styles.boardCard}
                style={{ '--bc': b.color, animationDelay: `${i * 55}ms` }}
                onClick={() => onOpen(b.id)}
              >
                <div className={styles.boardCardAccent} style={{ background: b.color }} />
                <div className={styles.boardCardBody}>

                  {/* Top: icon + info + ring */}
                  <div className={styles.boardCardTop}>
                    <div
                      className={styles.boardCardIcon}
                      style={{ background: `${b.color}1a`, border: `1px solid ${b.color}35` }}
                    >
                      {b.icon}
                    </div>
                    <div className={styles.boardCardInfo}>
                      <div className={styles.boardCardName}>{b.name}</div>
                      <div className={styles.boardCardMeta}>
                        {total} nodes · {b.threads.length} threads
                      </div>
                    </div>
                    <div className={styles.ringWrap}>
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="3" />
                        <circle
                          cx="24" cy="24" r={R} fill="none" stroke={b.color} strokeWidth="3"
                          strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - pct / 100)}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px', transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)' }}
                        />
                      </svg>
                      <span className={styles.ringPct} style={{ color: pct === 100 ? '#34d399' : b.color }}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {b.desc && <p className={styles.boardCardDesc}>{b.desc}</p>}

                  {/* Segmented type bar */}
                  <div className={styles.typeBar}>
                    {total === 0 ? (
                      <div className={styles.typeBarEmpty} />
                    ) : byType.map(({ k, count, c }) => (
                      <div key={k} className={styles.typeBarSeg}
                        style={{ width: `${count / total * 100}%`, background: c }} />
                    ))}
                  </div>

                  {/* Status chips */}
                  <div className={styles.statusRow}>
                    {done    > 0 && <span className={styles.sChip} style={{ color: '#34d399', background: 'rgba(52,211,153,0.09)' }}>✓ {done} done</span>}
                    {ip      > 0 && <span className={styles.sChip} style={{ color: '#7c5cfc', background: 'rgba(124,92,252,0.09)' }}>● {ip} active</span>}
                    {blocked > 0 && <span className={styles.sChip} style={{ color: '#f87171', background: 'rgba(248,113,113,0.09)' }}>! {blocked} blocked</span>}
                    {todo    > 0 && <span className={styles.sChip} style={{ color: '#3d4560', background: 'rgba(255,255,255,0.04)' }}>○ {todo} todo</span>}
                    {total === 0 && <span className={styles.sChip} style={{ color: '#3d4560', background: 'rgba(255,255,255,0.03)' }}>Empty board</span>}
                  </div>

                </div>
              </div>
            );
          })}

          <div className={styles.newBoardCard} onClick={onNew}>
            <div className={styles.newBoardIcon}>+</div>
            <span className={styles.newBoardLabel}>New Board</span>
          </div>
        </div>

      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sideWidget}>
          <div className={styles.sideWidgetHead}>Collaborators</div>
          {DEMO_COLLAB.map(c => (
            <div key={c.name} className={styles.collabRow}>
              <div className={styles.collabAvatar}>{c.avatar}</div>
              <div className={styles.collabInfo}>
                <div className={styles.collabName}>{c.name}</div>
                <div className={styles.collabRole}>{c.role}</div>
              </div>
              <div className={`${styles.collabDot}${c.active ? ` ${styles.collabDotActive}` : ''}`} />
            </div>
          ))}
        </div>
        <div className={styles.sideWidget}>
          <div className={styles.sideWidgetHead}>Recent Activity</div>
          {DEMO_ACTIVITY.map((a, i) => (
            <div key={i} className={styles.actRow}>
              <div className={styles.actDot} />
              <div className={styles.actContent}>
                <div className={styles.actAction}>
                  {a.action} <span className={styles.actBoard}>{a.board}</span>
                </div>
                <div className={styles.actMeta}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}

// ─── NEW BOARD MODAL ─────────────────────────────────────
interface ModalProps {
  onClose: () => void;
  onSave:  (b: Board) => void;
}

function NewBoardModal({ onClose, onSave }: ModalProps) {
  const [name,  setName]  = useState('');
  const [desc,  setDesc]  = useState('');
  const [color, setColor] = useState(BOARD_PALETTE[0]);
  const [icon,  setIcon]  = useState(BOARD_ICONS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onSave({
      id: `b${Date.now()}`,
      name: name.trim(),
      desc,
      color,
      icon,
      nodes: [],
      threads: [],
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Board</h2>

        <label className={styles.modalLabel}>Name</label>
        <input
          className={styles.modalInput}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Q2 Sprint"
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />

        <label className={styles.modalLabel}>Description</label>
        <input
          className={styles.modalInput}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="What's this board about?"
        />

        <label className={styles.modalLabel}>Color</label>
        <div className={styles.colorRow}>
          {BOARD_PALETTE.map(c => (
            <button
              key={c}
              className={`${styles.colorSwatch}${color === c ? ` ${styles.active}` : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <label className={styles.modalLabel}>Icon</label>
        <div className={styles.iconRow}>
          {BOARD_ICONS.map(ic => (
            <button
              key={ic}
              className={`${styles.iconBtn}${icon === ic ? ` ${styles.active}` : ''}`}
              onClick={() => setIcon(ic)}
            >
              {ic}
            </button>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onClose}>Cancel</button>
          <button className={styles.modalCreate} onClick={handleCreate}>Create Board</button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────
export default function ProjectBoards() {
  const [boards,  setBoards]  = useState<Board[]>(SEED_BOARDS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const activeBoard = boards.find(b => b.id === activeId) ?? null;

  const updateBoard = (updated: Board) =>
    setBoards(p => p.map(b => b.id === updated.id ? updated : b));

  if (activeBoard) {
    return (
      <BoardCanvas
        board={activeBoard}
        onBack={() => setActiveId(null)}
        onUpdate={updateBoard}
      />
    );
  }

  return (
    <>
      <Home
        boards={boards}
        onOpen={setActiveId}
        onNew={() => setShowNew(true)}
      />
      {showNew && (
        <NewBoardModal
          onClose={() => setShowNew(false)}
          onSave={b => { setBoards(p => [...p, b]); setActiveId(b.id); }}
        />
      )}
    </>
  );
}