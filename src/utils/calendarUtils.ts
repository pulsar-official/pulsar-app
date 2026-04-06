import type { CalEvent } from '@/types/productivity';

// ─── getDaysInMonth ────────────────────────────────────────────────────────────

/** Returns an array of Date objects for every day in the given month. */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= count; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

// ─── getWeekBounds ────────────────────────────────────────────────────────────

/** Returns Monday-start week bounds for a given date. */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
}

// ─── getEventPosition ─────────────────────────────────────────────────────────

const START_HOUR = 4;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

/**
 * Returns CSS top/height percentages for an event on the time grid.
 * startTime / endTime in "HH:MM" format.
 */
export function getEventPosition(
  startTime: string,
  endTime: string,
): { top: string; height: string } {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const gridStart = START_HOUR * 60;
  const gridEnd = END_HOUR * 60;
  const gridTotal = TOTAL_HOURS * 60;

  const s = Math.max(toMin(startTime), gridStart);
  const e = Math.min(toMin(endTime), gridEnd);
  const top = ((s - gridStart) / gridTotal) * 100;
  const height = Math.max(((e - s) / gridTotal) * 100, 0.5);

  return { top: `${top}%`, height: `${height}%` };
}

// ─── formatDateLabel ──────────────────────────────────────────────────────────

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDateLabel(date: Date, format: 'short' | 'medium' | 'long'): string {
  const d = date.getDate();
  const day = DAYS_SHORT[date.getDay()];
  const mon = MONTHS_SHORT[date.getMonth()];
  const monFull = MONTHS_FULL[date.getMonth()];
  const year = date.getFullYear();

  if (format === 'short') return `${mon} ${d}`;
  if (format === 'medium') return `${day}, ${mon} ${d}`;
  return `${day}, ${monFull} ${d}, ${year}`;
}

// ─── isSameDay ────────────────────────────────────────────────────────────────

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function eventOccursOn(ev: CalEvent, date: Date): boolean {
  const ds = fmtYMD(date);
  if (ev.date === ds) return true;
  // Multi-day span
  if (ev.dateEnd) {
    return ev.date <= ds && ev.dateEnd >= ds;
  }
  // Recurrence
  if (ev.recur) {
    const [ey, em, ed] = ev.date.split('-').map(Number);
    const origin = new Date(ey, em - 1, ed);
    if (origin > date) return false;
    const diff = Math.floor((date.getTime() - origin.getTime()) / 86_400_000);
    if (ev.recur === 'daily') return true;
    if (ev.recur === 'weekly') return diff % 7 === 0;
  }
  return false;
}

// ─── getEventsForDay ──────────────────────────────────────────────────────────

export function getEventsForDay(events: CalEvent[], date: Date): CalEvent[] {
  return events
    .filter((ev) => eventOccursOn(ev, date))
    .sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));
}

// ─── getUpcomingEvents ────────────────────────────────────────────────────────

export interface UpcomingEvent {
  event: CalEvent;
  date: Date;
}

export function getUpcomingEvents(events: CalEvent[], days: number): UpcomingEvent[] {
  const result: UpcomingEvent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dayEvents = getEventsForDay(events, d);
    dayEvents.forEach((ev) => result.push({ event: ev, date: d }));
  }
  return result;
}
