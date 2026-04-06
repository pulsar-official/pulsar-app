'use client';

import { useState } from 'react';
import styles from './CalendarMonthWidget.module.scss';
import { useProductivityStore } from '@/stores/productivityStore';
import { useUIStore } from '@/stores/uiStore';
import { getDaysInMonth, getEventsForDay, isSameDay } from '@/utils/calendarUtils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

export default function CalendarMonthWidget() {
  const events = useProductivityStore((s) => s.events);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const days = getDaysInMonth(viewYear, viewMonth);

  // Leading blanks: first day of month in Mon-start grid
  // getDay() returns 0=Sun…6=Sat; we need Mon=0…Sun=6
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;

  function handleDayClick(day: Date) {
    setCurrentPage('calendar');
  }

  return (
    <div className={styles.widget}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">‹</button>
        <span className={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
        <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">›</button>
      </div>

      {/* Day-of-week headers */}
      <div className={styles.weekRow}>
        {DAY_HEADERS.map(d => (
          <span key={d} className={styles.weekHeader}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.grid}>
        {/* Leading blanks */}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className={styles.blankCell} />
        ))}

        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDay(events, day);
          const dots = dayEvents.slice(0, 3);

          return (
            <button
              key={day.getDate()}
              className={`${styles.dayCell} ${isToday ? styles.todayCell : ''}`}
              onClick={() => handleDayClick(day)}
              aria-label={day.toDateString()}
            >
              <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                {day.getDate()}
              </span>
              {dots.length > 0 && (
                <div className={styles.dots}>
                  {dots.map((ev) => (
                    <span
                      key={ev.id}
                      className={styles.dot}
                      style={{ background: tagColor(ev.tag) }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
