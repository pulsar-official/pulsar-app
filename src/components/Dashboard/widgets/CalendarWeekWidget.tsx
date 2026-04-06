'use client';

import { useState } from 'react';
import styles from './CalendarWeekWidget.module.scss';
import { useProductivityStore } from '@/stores/productivityStore';
import { getWeekBounds, getEventsForDay, formatDateLabel, isSameDay } from '@/utils/calendarUtils';
import type { CalEvent } from '@/types/productivity';

// ─── Tag color map (mirrors calendar constants) ───────────────────────────────

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
  const ampm = h < 12 ? 'a' : 'p';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
}

// ─── Event Popover ────────────────────────────────────────────────────────────

interface PopoverProps {
  event: CalEvent;
  onClose: () => void;
}

function EventPopover({ event, onClose }: PopoverProps) {
  return (
    <div className={styles.popoverBackdrop} onClick={onClose}>
      <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
        <div className={styles.popoverDot} style={{ background: tagColor(event.tag) }} />
        <div className={styles.popoverBody}>
          <p className={styles.popoverTitle}>{event.title}</p>
          <p className={styles.popoverMeta}>
            {fmtTime(event.startTime)}
            {event.endTime ? ` – ${fmtTime(event.endTime)}` : ''}
          </p>
          <span className={styles.popoverTag} style={{ background: tagColor(event.tag) + '33', color: tagColor(event.tag) }}>
            {event.tag}
          </span>
        </div>
        <button className={styles.popoverClose} onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function CalendarWeekWidget() {
  const events = useProductivityStore((s) => s.events);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const today = new Date();
  const { start } = getWeekBounds(today);

  // Build Mon–Sun array (getWeekBounds returns Monday start)
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>This Week</span>
        <span className={styles.range}>{formatDateLabel(days[0], 'short')} – {formatDateLabel(days[6], 'short')}</span>
      </div>

      <div className={styles.grid}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDay(events, day);

          return (
            <div key={i} className={`${styles.dayCol} ${isToday ? styles.todayCol : ''}`}>
              <div className={styles.dayLabel}>
                <span className={styles.dayName}>{DAY_LABELS[i]}</span>
                <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className={styles.pills}>
                {dayEvents.length === 0 && (
                  <span className={styles.noEvents} />
                )}
                {dayEvents.slice(0, 4).map((ev) => (
                  <button
                    key={ev.id}
                    className={styles.pill}
                    style={{ background: tagColor(ev.tag) + '22', borderLeft: `2px solid ${tagColor(ev.tag)}` }}
                    onClick={() => setSelectedEvent(ev)}
                    title={ev.title}
                  >
                    <span className={styles.pillTitle}>{ev.title}</span>
                    {ev.startTime && (
                      <span className={styles.pillTime}>{fmtTime(ev.startTime)}</span>
                    )}
                  </button>
                ))}
                {dayEvents.length > 4 && (
                  <span className={styles.more}>+{dayEvents.length - 4} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
