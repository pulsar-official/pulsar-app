// --- PROJECT BOARDS - TYPES ---

export type NodeType =
  | 'task'
  | 'idea'
  | 'note'
  | 'bug'
  | 'milestone'
  | 'question';

export type NodeStatus =
  | 'todo'
  | 'inprogress'
  | 'blocked'
  | 'done';

export type NodePriority =
  | 'low'
  | 'medium'
  | 'high';

export type BoardColor = string; // hex, e.g. '#7c5cfc'

export interface BoardNode {
  id:       string;
  type:     NodeType;
  title:    string;
  body:     string;
  x:        number;
  y:        number;
  status:   NodeStatus;
  priority: NodePriority;
}

export interface BoardThread {
  id:    string;
  from:  string; // BoardNode.id
  to:    string; // BoardNode.id
  label: string;
}

export interface Board {
  id:      string;
  name:    string;
  desc:    string;
  color:   BoardColor;
  icon:    string;
  nodes:   BoardNode[];
  threads: BoardThread[];
}

// UI-only — thread with resolved node positions for SVG rendering
export interface ResolvedThread extends BoardThread {
  ax:   number;
  ay:   number;
  bx:   number;
  by:   number;
  path: string;
  mx:   number;
  my:   number;
}

// Active drag state
export interface DragState {
  id: string;
  ox: number; // canvas-space offset from node origin
  oy: number;
}

// Pan offset
export interface PanState {
  x: number;
  y: number;
}

// Derived board stats (never stored)
export interface BoardStats {
  total:   number;
  done:    number;
  ip:      number; // in-progress count
  blocked: number;
  todo:    number;
  threads: number;
  pct:     number; // 0–100 completion percentage
}