'use client';

import styles from './CalendarAgendaWidget.module.scss';
import { useProductivityStore } from '@/stores/productivityStore';
import { getUpcomingEvents, isSameDay } from '@/utils/calendarUtils';

// ─── Tag color map ────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
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

function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? TAG_COLORS.default;
}

function fmtTime(t: string | null): string {
  if (!t) return 'All day';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function dayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function CalendarAgendaWidget() {
  const events = useProductivityStore((s) => s.events);
  const upcoming = getUpcomingEvents(events, 7);

  // Group by date key
  const grouped: { label: string; items: typeof upcoming }[] = [];
  let lastKey = '';
  for (const item of upcoming) {
    const key = item.date.toDateString();
    if (key !== lastKey) {
      grouped.push({ label: dayLabel(item.date), items: [] });
      lastKey = key;
    }
    grouped[grouped.length - 1].items.push(item);
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>Upcoming</span>
        <span className={styles.sub}>Next 7 days</span>
      </div>

      <div className={styles.list}>
        {grouped.length === 0 && (
          <div className={styles.empty}>No upcoming events</div>
        )}

        {grouped.map((group, gi) => (
          <div key={gi} className={styles.group}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map(({ event }) => (
              <div key={event.id} className={styles.item}>
                <span
                  className={styles.dot}
                  style={{ background: tagColor(event.tag) }}
                />
                <div className={styles.itemBody}>
                  <span className={styles.itemTitle}>{event.title}</span>
                  <span className={styles.itemMeta}>
                    {fmtTime(event.startTime)}
                    {event.endTime ? ` – ${fmtTime(event.endTime)}` : ''}
                    {' '}
                    <span
                      className={styles.itemTag}
                      style={{ color: tagColor(event.tag) }}
                    >
                      {event.tag}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
