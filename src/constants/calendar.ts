import type { CalendarView, EventTag } from '@/types/calendar';

// ─── Views ────────────────────────────────────────────────────────────────────

export const CALENDAR_VIEWS: CalendarView[] = ['year', 'month', 'week', 'day'];

// ─── Date / Time Labels ───────────────────────────────────────────────────────

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DAYS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// ─── Time Grid ────────────────────────────────────────────────────────────────

/** First visible hour on the time grid (4 AM) */
export const START_HOUR = 4;

/** Last visible hour on the time grid (midnight = 24) */
export const END_HOUR = 24;

/** Pixel height of one hour row */
export const HOUR_H = 52;

/** Pixel width of the time-label gutter in week view */
export const TIME_COL = 48;

// ─── Tag Colors ───────────────────────────────────────────────────────────────

export const TAG_COLORS: Record<EventTag, string> = {
  skill:    '#06b6d4',
  pulsar:   '#ec4899',
  health:   '#10b981',
  work:     '#3b82f6',
  school:   '#64748b',
  fun:      '#f97316',
  worship:  '#14b8a6',
  personal: '#8b5cf6',
  routine:  '#71717a',
  urgent:   '#ef4444',
  meeting:  '#f59e0b',
  default:  '#6366f1',
};

export const COLOR_OPTIONS: { tag: EventTag; label: string }[] = [
  { tag: 'skill',    label: 'Skill'    },
  { tag: 'pulsar',   label: 'Pulsar'   },
  { tag: 'health',   label: 'Health'   },
  { tag: 'work',     label: 'Work'     },
  { tag: 'school',   label: 'School'   },
  { tag: 'fun',      label: 'Fun'      },
  { tag: 'worship',  label: 'Worship'  },
  { tag: 'personal', label: 'Personal' },
  { tag: 'routine',  label: 'Routine'  },
  { tag: 'urgent',   label: 'Urgent'   },
  { tag: 'meeting',  label: 'Meeting'  },
];

// ─── Classification ───────────────────────────────────────────────────────────

export const WORK_TAGS: EventTag[] = [
  'skill', 'pulsar', 'work', 'school', 'urgent', 'meeting', 'routine',
];

export const LEISURE_TAGS: EventTag[] = ['fun', 'personal', 'worship', 'health'];

export const WORK_KEYWORDS = [
  'study', 'learn', 'practice', 'build', 'code', 'write', 'design',
  'meeting', 'call', 'review', 'plan', 'prep', 'homework', 'project', 'task',
] as const;

export const LEISURE_KEYWORDS = [
  'game', 'gaming', 'watch', 'movie', 'show', 'hang', 'chill', 'relax',
  'browse', 'scroll', 'youtube', 'netflix', 'tv', 'valorant', 'anime',
  'party', 'social',
] as const;

// ─── Month / Week Banner Layout ───────────────────────────────────────────────

export const BANNER_H    = 20;   // px height of a spanning event bar
export const BANNER_GAP  = 3;    // px gap between stacked banner rows
export const ALLDAY_BAR_H   = 20;
export const ALLDAY_BAR_GAP = 3;

// ─── Tooltip ──────────────────────────────────────────────────────────────────

/** ms delay before the pill tooltip closes after mouse leaves */
export const PILL_HIDE_DELAY = 120;

/** Maximum number of dot indicators shown in the month pill before "+N" */
export const MAX_DOTS = 7;

