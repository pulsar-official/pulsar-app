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
export const SEED_BOARDS: Board[] = [];