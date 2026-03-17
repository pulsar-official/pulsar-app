import type { CalendarView, EventTag, CalEvent } from '@/types/calendar';

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

/** Generates seed events relative to the current week for local development */
export function generateMockEvents(): CalEvent[] {
  const ev: CalEvent[] = [];
  let id = 1;

  const wd = (o: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + o + 7);
    return fmt(d);
  };
  const wdPrev = (o: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + o);
    return fmt(d);
  };

  [1, 2, 3, 4].forEach(day => {
    const d = wd(day);
    ev.push(
      { id: 'e' + (id++), title: 'Workout',      date: d, dateEnd: null, start: '04:30', end: '05:00', tag: 'health',  recur: null },
      { id: 'e' + (id++), title: 'Math Study',   date: d, dateEnd: null, start: '05:10', end: '05:40', tag: 'skill',   recur: null },
      { id: 'e' + (id++), title: 'Piano',        date: d, dateEnd: null, start: '05:50', end: '06:20', tag: 'skill',   recur: null },
      { id: 'e' + (id++), title: 'Science',      date: d, dateEnd: null, start: '06:25', end: '06:55', tag: 'skill',   recur: null },
      { id: 'e' + (id++), title: 'School',       date: d, dateEnd: null, start: '07:30', end: '16:00', tag: 'school',  recur: null },
      { id: 'e' + (id++), title: 'Skill Growth', date: d, dateEnd: null, start: '19:00', end: '20:30', tag: 'skill',   recur: null },
      { id: 'e' + (id++), title: 'Pulsar',       date: d, dateEnd: null, start: '20:30', end: '23:00', tag: 'pulsar',  recur: null },
    );
  });

  const fri = wd(5);
  ev.push(
    { id: 'e' + (id++), title: 'Workout',  date: fri, dateEnd: null, start: '04:30', end: '05:00', tag: 'health',  recur: null },
    { id: 'e' + (id++), title: 'School',   date: fri, dateEnd: null, start: '07:30', end: '13:00', tag: 'school',  recur: null },
    { id: 'e' + (id++), title: 'Jumuah',   date: fri, dateEnd: null, start: '13:00', end: '15:00', tag: 'worship', recur: null },
    { id: 'e' + (id++), title: 'Work',     date: fri, dateEnd: null, start: '17:00', end: '21:00', tag: 'work',    recur: null },
    { id: 'e' + (id++), title: 'Valorant', date: fri, dateEnd: null, start: '23:00', end: '23:59', tag: 'fun',     recur: null },
  );

  const sat = wd(6);
  ev.push(
    { id: 'e' + (id++), title: 'Workout',  date: sat, dateEnd: null, start: '04:30', end: '05:00', tag: 'health',  recur: null },
    { id: 'e' + (id++), title: 'Piano',    date: sat, dateEnd: null, start: '05:10', end: '06:00', tag: 'skill',   recur: null },
    { id: 'e' + (id++), title: 'Work',     date: sat, dateEnd: null, start: '11:00', end: '15:00', tag: 'work',    recur: null },
    { id: 'e' + (id++), title: 'Pulsar',   date: sat, dateEnd: null, start: '15:00', end: '17:30', tag: 'pulsar',  recur: null },
    { id: 'e' + (id++), title: 'Valorant', date: sat, dateEnd: null, start: '21:00', end: '22:30', tag: 'fun',     recur: null },
  );

  const sun = wd(0);
  ev.push(
    { id: 'e' + (id++), title: 'Pulsar', date: sun, dateEnd: null, start: '06:00', end: '08:00', tag: 'pulsar', recur: null },
    { id: 'e' + (id++), title: 'Piano',  date: sun, dateEnd: null, start: '08:30', end: '10:30', tag: 'skill',  recur: null },
    { id: 'e' + (id++), title: 'Math',   date: sun, dateEnd: null, start: '11:00', end: '12:00', tag: 'skill',  recur: null },
    { id: 'e' + (id++), title: 'Pulsar', date: sun, dateEnd: null, start: '15:00', end: '17:00', tag: 'pulsar', recur: null },
    { id: 'e' + (id++), title: 'Gaming', date: sun, dateEnd: null, start: '21:00', end: '23:00', tag: 'fun',    recur: null },
  );

  // Single timed
  ev.push(
    { id: 'e' + (id++), title: 'BiteRight Sync', date: wd(3), dateEnd: null, start: '18:00', end: '18:30', tag: 'meeting', recur: null },
  );

  // Multi-day / all-day
  ev.push(
    { id: 'e' + (id++), title: 'InVenture Prize',  date: wd(4),     dateEnd: wd(6),  start: null, end: null, tag: 'urgent', recur: null },
    { id: 'e' + (id++), title: 'Spring Break',     date: wdPrev(1), dateEnd: wd(5),  start: null, end: null, tag: 'fun',    recur: null },
    { id: 'e' + (id++), title: 'BiteRight Sprint', date: wd(1),     dateEnd: wd(3),  start: null, end: null, tag: 'pulsar', recur: null },
    { id: 'e' + (id++), title: 'GT Hackathon',     date: wd(6),     dateEnd: wd(7),  start: null, end: null, tag: 'work',   recur: null },
  );

  return ev;
}

// ─── Utility (used inside constants to build mock data) ───────────────────────

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
