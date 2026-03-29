// --- FOCUS SESSIONS - CONSTANTS ---

import type { Priority, Task, TimerType, Resource } from '@/types/focusSessions';

// ─── DESIGN TOKENS ───
export const T = {
  bg:           '#0a0c10',
  bgCard:       '#12141a',
  bgHover:      '#1a1d26',
  bgActive:     '#22262f',
  border:       '#1e2230',
  borderHover:  '#2a2f40',
  text:         '#e8eaed',
  text2:        '#8b8fa4',
  text3:        '#5a5f73',
  accent:       '#7c5cfc',
  accentHover:  '#6b4de8',
  accentGlow:   'rgba(124,92,252,.15)',
  accentSubtle: 'rgba(124,92,252,.08)',
  green:        '#34d399',
  greenGlow:    'rgba(52,211,153,.12)',
  red:          '#f87171',
  redGlow:      'rgba(248,113,113,.12)',
  amber:        '#fbbf24',
  amberGlow:    'rgba(251,191,36,.12)',
  blue:         '#60a5fa',
} as const;

// ─── TIMER PRESETS ───
export const TIMER_TYPES: TimerType[] = [
  { id: 'pomodoro', label: 'Pomodoro',  icon: 'P', desc: 'Classic 25/5 cycles',     work: 25, rest: 5,  longRest: 15, cyclesBeforeLong: 4, color: '#7c5cfc', colorRgb: '124,92,252'  },
  { id: 'deepwork', label: 'Deep Work', icon: 'D', desc: 'Extended 50/10 blocks',   work: 50, rest: 10, longRest: 20, cyclesBeforeLong: 3, color: '#60a5fa', colorRgb: '96,165,250'  },
  { id: 'sprint',   label: 'Sprint',    icon: 'S', desc: 'Intense 90/15 sessions',  work: 90, rest: 15, longRest: 30, cyclesBeforeLong: 2, color: '#fbbf24', colorRgb: '251,191,36'  },
  { id: 'adaptive', label: 'Adaptive',  icon: 'A', desc: 'Extends if tasks remain', work: 30, rest: 8,  longRest: 20, cyclesBeforeLong: 3, color: '#34d399', colorRgb: '52,211,153'  },
  { id: 'custom',   label: 'Custom',    icon: 'C', desc: 'Set your own rhythm',     work: 25, rest: 5,  longRest: 15, cyclesBeforeLong: 4, color: '#94a3b8', colorRgb: '148,163,184' },
];

// ─── INITIAL TASKS ───
export const INITIAL_TASKS: Task[] = [];

// ─── PRIORITY COLORS ───
export const PRIORITY_COLORS: Record<Priority, string> = {
  high:   T.red,
  medium: T.amber,
  low:    T.green,
};

// ─── QUOTES ───
export const QUOTES: string[] = [
  'The secret of getting ahead is getting started.',
  'Focus is saying no to good ideas.',
  'Deep work is the superpower of the 21st century.',
  "You don't need more time. You need more focus.",
  'One hour of focused work beats three hours of distracted effort.',
];

// ─── QUIT MESSAGES ───
export const QUIT_MESSAGES: string[] = [
  "You've already invested {time} of deep focus.",
  'Your {streak}-session streak is on the line.',
  "You're {percent}% through — the hardest part is behind you.",
  'Future you will thank present you for finishing.',
];

// ─── HELPERS ───
export const fmt = (s: number): string => {
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export const CIRC = 2 * Math.PI * 120;

// Module-level mutable ID counter
export let nextTaskId = 1;
export const bumpTaskId = () => String(nextTaskId++);

// ─── RESOURCES ───
export const getResources = (title: string): Resource[] => {
  const t = title.toLowerCase();
  if (t.includes('animation') || t.includes('carousel') || t.includes('css'))
    return [{ icon: '⌘', label: 'MDN Animations' }, { icon: '▶', label: 'Easing ref' }, { icon: '◈', label: 'DevTools' }];
  if (t.includes('pitch') || t.includes('competition') || t.includes('write'))
    return [{ icon: '◉', label: 'Pitch template' }, { icon: '▲', label: 'Competitor notes' }];
  if (t.includes('pr') || t.includes('review') || t.includes('auth'))
    return [{ icon: '◈', label: 'GitHub' }, { icon: '◉', label: 'Auth docs' }];
  if (t.includes('refactor') || t.includes('zustand') || t.includes('store'))
    return [{ icon: '◈', label: 'Zustand docs' }, { icon: '▶', label: 'Current store' }];
  if (t.includes('typescript') || t.includes('error') || t.includes('type'))
    return [{ icon: '◈', label: 'TS Handbook' }, { icon: '▲', label: 'Error log' }];
  if (t.includes('design') || t.includes('questionnaire') || t.includes('onboard'))
    return [{ icon: '◉', label: 'Figma file' }, { icon: '▶', label: 'UX notes' }];
  if (t.includes('scss') || t.includes('style') || t.includes('token'))
    return [{ icon: '◈', label: 'Token sheet' }, { icon: '▶', label: 'SCSS docs' }];
  return [{ icon: '◈', label: 'Notes' }, { icon: '▶', label: 'References' }];
};