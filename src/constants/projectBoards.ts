// --- PROJECT BOARDS - CONSTANTS ---

import type { NodeType, NodeStatus, Board } from '@/types/projectBoards';

// ─── DESIGN TOKENS ───
export const T = {
  bg:    '#08090e',
  card:  '#0f1117',
  hover: '#141820',
  b:     '#1c2030',
  b2:    '#2a3048',
  t:     '#e2e4ed',
  t2:    '#7c8299',
  t3:    '#3d4560',
  ac:    '#7c5cfc',
  acG:   'rgba(124,92,252,0.14)',
  gr:    '#34d399',
  am:    '#fbbf24',
  re:    '#f87171',
  bl:    '#60a5fa',
  pk:    '#f472b6',
} as const;

// ─── NODE TYPE META ───
export const NODE_TYPES: Record<NodeType, { label: string; c: string }> = {
  task:      { label: 'Task',      c: '#60a5fa' },
  idea:      { label: 'Idea',      c: '#fbbf24' },
  note:      { label: 'Note',      c: '#7c5cfc' },
  bug:       { label: 'Bug',       c: '#f87171' },
  milestone: { label: 'Milestone', c: '#34d399' },
  question:  { label: 'Question',  c: '#f472b6' },
};

// ─── STATUS META ───
export const STATUS_META: Record<NodeStatus, { label: string; c: string }> = {
  todo:       { label: 'Todo',        c: '#3d4560' },
  inprogress: { label: 'In Progress', c: '#7c5cfc' },
  blocked:    { label: 'Blocked',     c: '#f87171' },
  done:       { label: 'Done',        c: '#34d399' },
};

// ─── COLOUR PALETTE (board creation picker) ───
export const BOARD_PALETTE: readonly string[] = [
  '#7c5cfc', '#34d399', '#f472b6',
  '#fbbf24', '#f87171', '#60a5fa',
];

// ─── ICON SET (board creation picker) ───
export const BOARD_ICONS: readonly string[] = [
  '📋', '⚡', '🎯', '🚀', '🎨', '💡',
  '🏗️', '📊', '🍽', '🌟', '🔬', '🛠️',
];

// ─── CANVAS DEFAULTS ───
export const CANVAS_DEFAULTS = {
  panX:   60,
  panY:   60,
  scale:  0.85,
  nodeW:  210,  // node card width in px
  nodeHC: 55,   // approximate vertical centre offset for thread anchors
  gridSz: 28,   // dot-grid spacing in px
  snapSz: 8,    // drag snap grid in px
} as const;

// ─── NODE ID COUNTER ───
let _nid = 1;
export const nextNodeId = (): string => `n${_nid++}`;

// ─── THREAD ID HELPER ───
export const nextThreadId = (): string => `t${Date.now()}`;

// ─── CUBIC BEZIER PATH ───
// Horizontal S-curve between two canvas points
export const curvePath = (ax: number, ay: number, bx: number, by: number): string => {
  const mx = (ax + bx) / 2;
  return `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`;
};

// ─── SEED DATA ───
export const SEED_BOARDS: Board[] = [
  {
    id: 'b1',
    name: 'Pulsar v2 Roadmap',
    color: '#7c5cfc',
    icon: '⚡',
    desc: 'React/TSX migration & pillar architecture',
    nodes: [
      { id: 'n1', type: 'milestone', title: 'Phase 1: Foundation',   body: 'Next.js, Clerk, Zustand, TanStack',    x: 60,  y: 60,  status: 'done',       priority: 'high'   },
      { id: 'n2', type: 'task',      title: 'PulsarCalendar.tsx',    body: '5 views, drag-drop, recurring events', x: 360, y: 40,  status: 'done',       priority: 'high'   },
      { id: 'n3', type: 'task',      title: 'PulsarTasks.tsx',       body: 'List / Kanban / Timeline',             x: 360, y: 200, status: 'done',       priority: 'high'   },
      { id: 'n4', type: 'task',      title: 'FocusSessions.tsx',     body: '5 timer modes, locked session flow',   x: 360, y: 360, status: 'inprogress', priority: 'high'   },
      { id: 'n5', type: 'task',      title: 'Boards Canvas',         body: 'Spatial pan/zoom, SVG threads',        x: 660, y: 120, status: 'inprogress', priority: 'high'   },
      { id: 'n6', type: 'idea',      title: 'AI Assist Layer',       body: 'Proactive suggestions across pillars', x: 660, y: 320, status: 'todo',       priority: 'medium' },
      { id: 'n7', type: 'note',      title: 'Supabase — Phase 7',    body: 'Defer until core modules stable',      x: 60,  y: 340, status: 'todo',       priority: 'low'    },
      { id: 'n8', type: 'milestone', title: 'Phase 2: Insights',     body: 'Analytics, heatmaps, dashboards',      x: 940, y: 200, status: 'todo',       priority: 'medium' },
    ],
    threads: [
      { id: 't1', from: 'n1', to: 'n2', label: 'unlocks' },
      { id: 't2', from: 'n1', to: 'n3', label: 'unlocks' },
      { id: 't3', from: 'n1', to: 'n4', label: 'unlocks' },
      { id: 't4', from: 'n4', to: 'n5', label: 'parallel' },
      { id: 't5', from: 'n5', to: 'n8', label: 'leads to' },
      { id: 't6', from: 'n6', to: 'n8', label: 'feeds' },
    ],
  },
  {
    id: 'b2',
    name: 'BiteRight MVP',
    color: '#34d399',
    icon: '🍽',
    desc: 'GT InVenture Prize — AI meal planning app',
    nodes: [
      { id: 'm1', type: 'milestone', title: 'Competition Deadline',          body: 'Submission + demo day prep',            x: 400, y: 40,  status: 'inprogress', priority: 'high'   },
      { id: 'm2', type: 'task',      title: 'Onboarding Flow',               body: 'Diet → cuisine → allergies → budget',   x: 80,  y: 160, status: 'done',       priority: 'high'   },
      { id: 'm3', type: 'task',      title: 'Recipe DB (84+)',               body: 'Calorie/macro data, expanded db',        x: 80,  y: 320, status: 'done',       priority: 'high'   },
      { id: 'm4', type: 'task',      title: 'Grocery List Gen',              body: 'Auto-generate from meal plan',           x: 380, y: 220, status: 'done',       priority: 'medium' },
      { id: 'm5', type: 'task',      title: 'Store Locator Map',             body: 'Maps + 25 real Alpharetta stores',       x: 380, y: 380, status: 'inprogress', priority: 'medium' },
      { id: 'm6', type: 'idea',      title: 'Price Comparison',              body: 'Live pricing API — stretch goal',        x: 660, y: 300, status: 'todo',       priority: 'low'    },
      { id: 'm7', type: 'note',      title: 'Team: Ghibran, Koray, Princeton', body: 'Slides due Fri',                       x: 660, y: 120, status: 'inprogress', priority: 'high'   },
      { id: 'm8', type: 'bug',       title: 'Map on first mount',            body: 'State not persisting on first render',   x: 900, y: 300, status: 'todo',       priority: 'high'   },
    ],
    threads: [
      { id: 'u1', from: 'm2', to: 'm4', label: 'feeds' },
      { id: 'u2', from: 'm3', to: 'm4', label: 'source' },
      { id: 'u3', from: 'm4', to: 'm5', label: 'links to' },
      { id: 'u4', from: 'm5', to: 'm6', label: 'extends' },
      { id: 'u5', from: 'm7', to: 'm1', label: 'blocks' },
      { id: 'u6', from: 'm5', to: 'm8', label: 'has bug' },
    ],
  },
  {
    id: 'b3',
    name: 'Design System',
    color: '#f472b6',
    icon: '🎨',
    desc: 'SCSS modules, token system, component library',
    nodes: [
      { id: 'd1', type: 'milestone', title: 'Token Foundation',    body: 'OKLCH colors, 4px grid, type scale',  x: 120, y: 100, status: 'done',       priority: 'high'   },
      { id: 'd2', type: 'task',      title: 'SCSS Module System',  body: 'Per-component .module.scss files',    x: 400, y: 60,  status: 'inprogress', priority: 'high'   },
      { id: 'd3', type: 'task',      title: 'Animation Library',   body: 'slideDown, pulse, fadeIn keyframes',  x: 400, y: 220, status: 'inprogress', priority: 'medium' },
      { id: 'd4', type: 'idea',      title: 'Dark/Light Toggle',   body: 'CSS var swap, persist to store',      x: 660, y: 140, status: 'todo',       priority: 'low'    },
      { id: 'd5', type: 'note',      title: 'color-mix() usage',   body: 'Accent tints — check browser support', x: 660, y: 300, status: 'todo',      priority: 'medium' },
    ],
    threads: [
      { id: 'v1', from: 'd1', to: 'd2', label: 'source' },
      { id: 'v2', from: 'd1', to: 'd3', label: 'uses' },
      { id: 'v3', from: 'd2', to: 'd4', label: 'enables' },
      { id: 'v4', from: 'd3', to: 'd5', label: 'related' },
    ],
  },
];