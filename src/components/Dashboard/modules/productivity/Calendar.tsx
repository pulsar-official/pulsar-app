'use client';

import {
  useState, useEffect, useRef, useCallback, useMemo, memo,
  type CSSProperties, type ReactNode,
} from 'react';

import styles from './Calendar.module.scss';
import { useProductivityStore } from '@/stores/productivityStore';
import PrivacyToggle from '../shared/PrivacyToggle';

import type {
  CalEvent, CalEventForm, CalendarView, CalendarAnim,
  EventTag, RecurRule, PositionedEvent, SpanningEvent, MonthCell,
  DayBalance,
  YearViewProps, MonthViewProps, WeekViewProps, DayViewProps,
  EventModalProps, ClockProps, ClockDigitProps, InsightRowProps,
} from '@/types/calendar';

import {
  CALENDAR_VIEWS, DAYS_SHORT, DAYS_FULL, MONTHS_FULL, MONTHS_SHORT,
  START_HOUR, END_HOUR, HOUR_H, TIME_COL,
  TAG_COLORS, COLOR_OPTIONS,
  WORK_TAGS, LEISURE_TAGS, WORK_KEYWORDS, LEISURE_KEYWORDS,
  BANNER_H, BANNER_GAP, ALLDAY_BAR_H, ALLDAY_BAR_GAP,
  PILL_HIDE_DELAY, MAX_DOTS,
} from '@/constants/calendar';

// ─── CSS custom properties injected on .root ──────────────────────────────────

const ROOT_VARS = {
  '--pc-bg':          '#07070d',
  '--pc-surface':     '#0c0c14',
  '--pc-s2':          '#111119',
  '--pc-s3':          '#18181f',
  '--pc-s4':          '#202028',
  '--pc-border':      '#1a1a26',
  '--pc-border2':     '#26263a',
  '--pc-text':        '#eeeef5',
  '--pc-text2':       '#b8b8cc',
  '--pc-text3':       '#7878a0',
  '--pc-text4':       '#55556a',
  '--pc-accent':      '#a78bfa',
  '--pc-accent2':     '#c4b5fd',
  '--pc-accent-soft': 'rgba(167,139,250,0.1)',
  '--pc-blue':        '#60a5fa',
  '--pc-blue2':       '#93c5fd',
  '--pc-blue-soft':   'rgba(96,165,250,0.1)',
  '--pc-success':     '#6ee7b7',
  '--pc-danger':      '#fca5a5',
  '--pc-ease':        'cubic-bezier(0.22,1,0.36,1)',
  '--pc-ease-out':    'cubic-bezier(0.16,1,0.3,1)',
  '--pc-ease-bounce': 'cubic-bezier(0.34,1.56,0.64,1)',
  '--pc-font':        "'Outfit', system-ui, sans-serif",
  '--pc-mono':        "'JetBrains Mono', monospace",
  '--pc-r':           '10px',
  '--pc-rs':          '6px',
  '--pc-rl':          '14px',
} as CSSProperties;

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function isToday(d: Date): boolean {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
function weekStart(d: Date): Date {
  const w = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - w);
}
function daysInMonth(y: number, m: number): number { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number): number { return new Date(y, m, 1).getDay(); }
function timeToMin(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minToPos(m: number): number { return ((m / 60) - START_HOUR) * HOUR_H; }
function fmtTime(t: string | null, use24h: boolean): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = +h;
  if (use24h) return `${hr}:${m}`;
  return `${hr % 12 || 12}:${m}${hr < 12 ? 'a' : 'p'}`;
}
function fmtHour(hr: number, use24h: boolean): string {
  if (use24h) return hr + ':00';
  if (hr === 0) return '12a';
  if (hr < 12) return hr + 'a';
  if (hr === 12) return '12p';
  return (hr - 12) + 'p';
}
function uid(): string { return 'e' + Date.now() + Math.random().toString(36).slice(2, 6); }

function classifyEvent(ev: CalEvent): 'work' | 'leisure' {
  const tag = ev.tag || 'default';
  if (WORK_TAGS.includes(tag as EventTag)) return 'work';
  if (LEISURE_TAGS.includes(tag as EventTag)) return 'leisure';
  const title = (ev.title || '').toLowerCase();
  if (WORK_KEYWORDS.some(k => title.includes(k))) return 'work';
  if (LEISURE_KEYWORDS.some(k => title.includes(k))) return 'leisure';
  if (ev.start) return 'work';
  return 'leisure';
}

function calcBalance(events: CalEvent[]): DayBalance {
  let w = 0, l = 0;
  events.forEach(ev => {
    if (!ev.start) return;
    const type = classifyEvent(ev);
    const s = timeToMin(ev.start);
    const e = ev.end ? timeToMin(ev.end) : s + 30;
    if (type === 'work') w += (e - s); else l += (e - s);
  });
  const ratio = w > 0 ? (l / w) : 0;
  let text = '', icon = '';
  if (w === 0 && l === 0)  { text = 'Free day';       icon = '🤷'; }
  else if (ratio < 0.15)   { text = 'Heavy work day'; icon = '💪'; }
  else if (ratio < 0.4)    { text = 'Productive flow'; icon = '🎯'; }
  else if (ratio < 0.8)    { text = 'Balanced day';   icon = '⚖️'; }
  else                     { text = 'Chill vibes';     icon = '😎'; }
  return {
    workHrs: Math.round(w / 60 * 10) / 10,
    leisureHrs: Math.round(l / 60 * 10) / 10,
    text, icon,
  };
}

function eventsFor(events: CalEvent[], date: Date): CalEvent[] {
  const ds = fmt(date);
  return events.filter(e => {
    if (e.date === ds) return true;
    if (e.recur) {
      const ed = parse(e.date);
      if (ed > date) return false;
      const diff = Math.floor((date.getTime() - ed.getTime()) / 864e5);
      if (e.recur === 'daily') return true;
      if (e.recur === 'weekly') return diff % 7 === 0;
    }
    return false;
  }).sort((a, b) => (a.start || '99').localeCompare(b.start || '99'));
}

function evBg(ev: CalEvent): string {
  return TAG_COLORS[ev.tag] || TAG_COLORS.default;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const ChevL = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>;
const ChevR = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>;
const PlusIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
const BoltIcon = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

// ─── ClockDigit ───────────────────────────────────────────────────────────────

const ClockDigit = memo(({ value }: ClockDigitProps) => {
  const prev = useRef(value);
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    if (value !== prev.current) {
      setAnim(true); prev.current = value;
      const t = setTimeout(() => setAnim(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span className={styles.clockDigit}>
      <span className={`${styles.clockDigitInner}${anim ? ` ${styles.anim}` : ''}`}>
        <span className={styles.clockDigitChar}>{value}</span>
      </span>
    </span>
  );
});
ClockDigit.displayName = 'ClockDigit';

// ─── Clock ────────────────────────────────────────────────────────────────────

const Clock = memo(({ use24h, onToggle }: ClockProps) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const rawH = h;
  if (!use24h) h = h % 12 || 12;
  const h1 = String(Math.floor(h / 10)), h2 = String(h % 10);
  const m1 = String(Math.floor(m / 10)), m2 = String(m % 10);
  const s1 = String(Math.floor(s / 10)), s2 = String(s % 10);
  return (
    <div className={styles.clock}>
      <div className={styles.clockDigits}>
        <span style={{ display: 'flex' }}><ClockDigit value={h1} /><ClockDigit value={h2} /></span>
        <span className={styles.clockSep}>:</span>
        <span style={{ display: 'flex' }}><ClockDigit value={m1} /><ClockDigit value={m2} /></span>
        <span className={`${styles.clockSep} ${styles.clockSecSep}`}>:</span>
        <span className={styles.clockSecs} style={{ display: 'flex' }}><ClockDigit value={s1} /><ClockDigit value={s2} /></span>
        {!use24h && <span className={styles.clockAmPm}>{rawH < 12 ? 'AM' : 'PM'}</span>}
      </div>
      <div className={styles.clockToggleWrap}>
        <div className={`${styles.clockToggle}${use24h ? ` ${styles.active}` : ''}`} onClick={onToggle}>
          <div className={`${styles.clockToggleThumb}${use24h ? ` ${styles.active}` : ''}`} />
        </div>
        <span className={styles.clockLabel}>{use24h ? '24h' : '12h'}</span>
      </div>
    </div>
  );
});
Clock.displayName = 'Clock';

// ─── InsightRow ───────────────────────────────────────────────────────────────

const InsightRow = ({ icon, iconBg, iconColor, noBorder, children }: InsightRowProps) => (
  <div className={`${styles.insightRow}${noBorder ? ` ${styles.noBorder}` : ''}`}>
    <div className={styles.insightIcon} style={{ background: iconBg, color: iconColor }}>{icon}</div>
    <div className={styles.insightText}>{children}</div>
  </div>
);

// ─── YearView ─────────────────────────────────────────────────────────────────

const YearView = memo(({ year, events, onMonthClick }: YearViewProps) => (
  <div className={styles.yearGrid}>
    {Array.from({ length: 12 }, (_, m) => {
      const fd = firstDayOfMonth(year, m);
      const days = daysInMonth(year, m);
      return (
        <div key={m} className={styles.yearMonth} onClick={() => onMonthClick(m)}>
          <div className={styles.yearMonthLabel}>{MONTHS_SHORT[m]}</div>
          <div className={styles.yearMiniGrid}>
            {Array.from({ length: fd }, (_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: days }, (_, d) => {
              const date = new Date(year, m, d + 1);
              const td = isToday(date);
              const hasEv = eventsFor(events, date).length > 0;
              return (
                <div key={d} className={`${styles.yearDay}${td ? ` ${styles.today}` : hasEv ? ` ${styles.hasEvent}` : ''}`}>
                  {d + 1}
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
));
YearView.displayName = 'YearView';

// ─── MonthView ────────────────────────────────────────────────────────────────

const MonthView = memo(({ year, month, events, use24h, onDayClick, onDayDbl, onEventEdit }: MonthViewProps) => {
  const fd = firstDayOfMonth(year, month);
  const days = daysInMonth(year, month);
  const prevDays = daysInMonth(year, month - 1);
  const cells: MonthCell[] = [];
  for (let i = fd - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevDays - i), ot: true });
  for (let d = 1; d <= days; d++) cells.push({ date: new Date(year, month, d), ot: false });
  const rem = (7 - cells.length % 7) % 7;
  for (let d = 1; d <= rem; d++) cells.push({ date: new Date(year, month + 1, d), ot: true });
  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const multiDayEvents = events.filter(ev => !ev.start);
  const timedEvents = events.filter(ev => ev.start);

  const timedFor = (date: Date): CalEvent[] =>
    timedEvents.filter(ev => {
      const ds = fmt(date);
      if (ev.date === ds) return true;
      if (ev.recur) {
        const ed = parse(ev.date);
        if (ed > date) return false;
        const diff = Math.floor((date.getTime() - ed.getTime()) / 864e5);
        if (ev.recur === 'daily') return true;
        if (ev.recur === 'weekly') return diff % 7 === 0;
      }
      return false;
    }).sort((a, b) => (a.start!).localeCompare(b.start!));

  const getSpanningEvents = (week: MonthCell[]): SpanningEvent[] => {
    const ws = week[0].date, we = week[6].date;
    const raw = multiDayEvents.filter(ev => {
      const evStart = parse(ev.date);
      const evEnd = ev.dateEnd ? parse(ev.dateEnd) : evStart;
      return evStart <= we && evEnd >= ws;
    }).map(ev => {
      const evStart = parse(ev.date);
      const evEnd = ev.dateEnd ? parse(ev.dateEnd) : evStart;
      const clampStart = evStart < ws ? ws : evStart;
      const clampEnd = evEnd > we ? we : evEnd;
      const colStart = week.findIndex(c => fmt(c.date) === fmt(clampStart));
      const colEnd = week.findIndex(c => fmt(c.date) === fmt(clampEnd));
      return {
        ...ev, colStart, colEnd, span: colEnd - colStart + 1,
        startsThisWeek: fmt(evStart) === fmt(clampStart),
        endsThisWeek: fmt(evEnd) === fmt(clampEnd),
        row: 0,
      } as SpanningEvent;
    }).sort((a, b) => a.date.localeCompare(b.date));

    const assigned: SpanningEvent[] = [];
    raw.forEach(ev => {
      let row = 0;
      while (assigned.some(r => r.row === row && r.colEnd >= ev.colStart && r.colStart <= ev.colEnd)) row++;
      assigned.push({ ...ev, row });
    });
    return assigned;
  };

  return (
    <div className={styles.monthShell}>
      <div className={styles.monthDayHeader}>
        {DAYS_SHORT.map((d) => (
          <div key={d} className={styles.monthDayLabel}>{d}</div>
        ))}
      </div>
      <div className={styles.monthBody}>
        {weeks.map((week, wi) => {
          const rowAssign = getSpanningEvents(week);
          const bannerRows = rowAssign.length ? Math.max(...rowAssign.map(r => r.row)) + 1 : 0;
          const bannerZoneH = bannerRows > 0 ? bannerRows * (BANNER_H + BANNER_GAP) + 4 : 0;

          return (
            <div key={wi} className={styles.monthWeekRow}>
              <div className={styles.monthWeekCells}>
                {week.map((cell, di) => {
                  const td = isToday(cell.date);
                  const timed = timedFor(cell.date);
                  const dots = timed.slice(0, MAX_DOTS);
                  const overflow = timed.length - MAX_DOTS;
                  return (
                    <MonthCellItem
                      key={di}
                      cell={cell}
                      td={td}
                      timed={timed}
                      dots={dots}
                      overflow={overflow}
                      bannerZoneH={bannerZoneH}
                      use24h={use24h}
                      onDayClick={onDayClick}
                      onDayDbl={onDayDbl}
                      onEventEdit={onEventEdit}
                    />
                  );
                })}
              </div>

              {rowAssign.map(ev => {
                const color = TAG_COLORS[ev.tag] || TAG_COLORS.default;
                const top = 30 + ev.row * (BANNER_H + BANNER_GAP);
                const leftPct = (ev.colStart / 7) * 100;
                const widthPct = (ev.span / 7) * 100;
                const lOff = ev.colStart === 0 ? 3 : 0;
                const rOff = ev.colEnd === 6 ? 3 : 0;
                const br = `${ev.startsThisWeek ? '10px' : '0'} ${ev.endsThisWeek ? '10px' : '0'} ${ev.endsThisWeek ? '10px' : '0'} ${ev.startsThisWeek ? '10px' : '0'}`;
                return (
                  <div
                    key={ev.id}
                    className={styles.banner}
                    onClick={e => { e.stopPropagation(); onEventEdit(ev.id); }}
                    style={{
                      top, height: BANNER_H, background: color, borderRadius: br,
                      left: `calc(${leftPct}% + ${lOff}px)`,
                      width: `calc(${widthPct}% - ${lOff + rOff}px)`,
                      paddingLeft: ev.startsThisWeek ? '9px' : '5px',
                      paddingRight: '5px',
                    }}
                  >
                    <span className={`${styles.bannerLabel}${!ev.startsThisWeek ? ` ${styles.continuation}` : ''}`}>
                      {ev.title}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});
MonthView.displayName = 'MonthView';

// Month cell extracted to its own component so hooks (useState/useRef) are valid
interface MonthCellProps {
  cell: MonthCell;
  td: boolean;
  timed: CalEvent[];
  dots: CalEvent[];
  overflow: number;
  bannerZoneH: number;
  use24h: boolean;
  onDayClick: (d: Date) => void;
  onDayDbl: (s: string) => void;
  onEventEdit: (id: string) => void;
}

const MonthCellItem = ({
  cell, td, timed, dots, overflow, bannerZoneH, use24h, onDayClick, onDayDbl, onEventEdit,
}: MonthCellProps) => {
  const [pillHovered, setPillHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showPill = () => { if (hideTimer.current) clearTimeout(hideTimer.current); setPillHovered(true); };
  const hidePill = () => { hideTimer.current = setTimeout(() => setPillHovered(false), PILL_HIDE_DELAY); };

  return (
    <div
      className={`${styles.monthCell}${cell.ot ? ` ${styles.otherMonth}` : ''}`}
      onClick={() => onDayClick(cell.date)}
      onDoubleClick={() => onDayDbl(fmt(cell.date))}
    >
      <div
        className={styles.monthDateNum}
        style={{ marginBottom: `${bannerZoneH + 4}px` }}
      >
        <span className={`${styles.monthDateCircle}${td ? ` ${styles.today}` : ''}`}>
          {cell.date.getDate()}
        </span>
      </div>

      {timed.length > 0 && (
        <div
          className={styles.dotPillWrap}
          onClick={e => e.stopPropagation()}
          onMouseEnter={showPill}
          onMouseLeave={hidePill}
        >
          <div className={`${styles.dotPill}${pillHovered ? ` ${styles.hovered}` : ''}`}>
            {dots.map(ev => (
              <span key={ev.id} className={styles.dot} style={{ background: TAG_COLORS[ev.tag] || TAG_COLORS.default }} />
            ))}
            {overflow > 0 && <span className={styles.dotOverflow}>+{overflow}</span>}
          </div>

          {pillHovered && (
            <div className={styles.dotBridge} onMouseEnter={showPill} onMouseLeave={hidePill} />
          )}

          {pillHovered && (
            <div className={styles.dotPopup} onMouseEnter={showPill} onMouseLeave={hidePill}>
              {timed.map(ev => (
                <div key={ev.id} className={styles.dotPopupRow} onClick={() => onEventEdit(ev.id)}>
                  <span className={styles.dot} style={{ background: TAG_COLORS[ev.tag] || TAG_COLORS.default }} />
                  <span className={styles.dotPopupTitle}>{ev.title}</span>
                  {ev.start && <span className={styles.dotPopupTime}>{fmtTime(ev.start, use24h)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── WeekView ─────────────────────────────────────────────────────────────────

const WeekView = memo(({ date, events, use24h, onDayClick, onDayDbl, onEventEdit }: WeekViewProps) => {
  const ws = weekStart(date);
  const cols = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return d; });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });

  useEffect(() => {
    const iv = setInterval(() => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); }, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const targetHour = Math.max(START_HOUR, now.getHours() - 2);
      scrollRef.current.scrollTop = (targetHour - START_HOUR) * HOUR_H;
    }
  }, []);

  const positionedByDay = useMemo(() => cols.map(d => {
    const timed = eventsFor(events, d).filter(e => e.start);
    const items: PositionedEvent[] = timed.map(e => ({
      ...e,
      startMin: timeToMin(e.start!),
      endMin: e.end ? timeToMin(e.end) : timeToMin(e.start!) + 30,
      column: 0, totalCols: 1,
    }));
    items.forEach((e, i) => {
      let col = 0;
      const overlaps = items.slice(0, i).filter(o => o.startMin < e.endMin && o.endMin > e.startMin);
      if (overlaps.length) { const used = overlaps.map(o => o.column); while (used.includes(col)) col++; }
      e.column = col;
    });
    items.forEach(e => {
      const overlaps = items.filter(o => o.id !== e.id && o.startMin < e.endMin && o.endMin > e.startMin);
      e.totalCols = Math.max(e.column + 1, ...overlaps.map(o => o.column + 1), 1);
    });
    return items;
  }), [cols, events]);

  const multiDayEvents = useMemo(() => events.filter(e => !e.start), [events]);
  const spanningForWeek = useMemo((): SpanningEvent[] => {
    const wStart = cols[0], wEnd = cols[6];
    const raw = multiDayEvents.filter(ev => {
      const evStart = parse(ev.date);
      const evEnd = ev.dateEnd ? parse(ev.dateEnd) : evStart;
      return evStart <= wEnd && evEnd >= wStart;
    }).map(ev => {
      const evStart = parse(ev.date);
      const evEnd = ev.dateEnd ? parse(ev.dateEnd) : evStart;
      const clampStart = evStart < wStart ? wStart : evStart;
      const clampEnd = evEnd > wEnd ? wEnd : evEnd;
      const colStart = cols.findIndex(c => fmt(c) === fmt(clampStart));
      const colEnd = cols.findIndex(c => fmt(c) === fmt(clampEnd));
      return {
        ...ev, colStart, colEnd, span: colEnd - colStart + 1,
        startsThisWeek: fmt(evStart) === fmt(clampStart),
        endsThisWeek: fmt(evEnd) === fmt(clampEnd),
        row: 0,
      } as SpanningEvent;
    }).sort((a, b) => a.date.localeCompare(b.date));

    const assigned: SpanningEvent[] = [];
    raw.forEach(ev => {
      let row = 0;
      while (assigned.some(r => r.row === row && r.colEnd >= ev.colStart && r.colStart <= ev.colEnd)) row++;
      assigned.push({ ...ev, row });
    });
    return assigned;
  }, [cols, multiDayEvents]);

  const allDayRows = spanningForWeek.length ? Math.max(...spanningForWeek.map(r => r.row)) + 1 : 0;
  const allDayZoneH = allDayRows > 0 ? allDayRows * (ALLDAY_BAR_H + ALLDAY_BAR_GAP) + 8 : 0;
  const hasAllDay = allDayRows > 0;

  const gridCols = `${TIME_COL}px repeat(7, 1fr)`;

  return (
    <div className={styles.weekShell}>
      {/* Day headers */}
      <div className={styles.weekDayHeader} style={{ gridTemplateColumns: gridCols }}>
        <div />
        {cols.map((d, i) => {
          const td = isToday(d);
          return (
            <div
              key={i}
              className={styles.weekDayCol}
              onClick={() => onDayClick(d)}
              onDoubleClick={() => onDayDbl(fmt(d))}
            >
              <div className={`${styles.weekDayName}${td ? ` ${styles.today}` : ''}`}>
                {DAYS_SHORT[d.getDay()]}
              </div>
              <div className={`${styles.weekDayNum}${td ? ` ${styles.today}` : ''}`}>
                {d.getDate()}
              </div>
              {td && <div className={styles.weekTodayDot} />}
            </div>
          );
        })}
      </div>

      {/* All-day spanning zone */}
      {hasAllDay && (
        <div className={styles.allDayZone} style={{ height: allDayZoneH }}>
          <div className={styles.allDayGrid} style={{ gridTemplateColumns: gridCols }}>
            <div className={styles.allDayLabel}>all day</div>
            {cols.map((_, i) => <div key={i} className={styles.allDayColBorder} />)}
          </div>
          {spanningForWeek.map(ev => {
            const color = TAG_COLORS[ev.tag] || TAG_COLORS.default;
            const top = 4 + ev.row * (ALLDAY_BAR_H + ALLDAY_BAR_GAP);
            const colW = `(100% - ${TIME_COL}px) / 7`;
            const lOff = ev.colStart === 0 ? 3 : 0;
            const rOff = ev.colEnd === 6 ? 3 : 0;
            const left = `${TIME_COL}px + ${ev.colStart} * (${colW}) + ${lOff}px`;
            const width = `${ev.span} * (${colW}) - ${lOff + rOff}px`;
            const br = `${ev.startsThisWeek ? '10px' : '0'} ${ev.endsThisWeek ? '10px' : '0'} ${ev.endsThisWeek ? '10px' : '0'} ${ev.startsThisWeek ? '10px' : '0'}`;
            return (
              <div
                key={ev.id}
                className={styles.banner}
                onClick={() => onEventEdit(ev.id)}
                style={{
                  top, height: ALLDAY_BAR_H, background: color, borderRadius: br,
                  left: `calc(${left})`, width: `calc(${width})`,
                  paddingLeft: ev.startsThisWeek ? '9px' : '5px', paddingRight: '5px',
                }}
              >
                <span className={`${styles.bannerLabel}${!ev.startsThisWeek ? ` ${styles.continuation}` : ''}`}>
                  {ev.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className={styles.weekTimeGrid}>
        <div className={styles.weekTimeGridInner} style={{ gridTemplateColumns: gridCols, minHeight: `${(END_HOUR - START_HOUR) * HOUR_H}px` }}>
          {/* Full-width now line */}
          {nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60 && cols.some(d => isToday(d)) && (
            <div className={styles.nowLine} style={{ left: TIME_COL, top: minToPos(nowMin) }} />
          )}
          {/* Hour labels */}
          <div className={styles.hourLabels}>
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div key={i} className={styles.hourLabel} style={{ height: HOUR_H }}>
                {i > 0 ? fmtHour(START_HOUR + i, use24h) : ''}
              </div>
            ))}
          </div>
          {/* Day columns */}
          {cols.map((d, ci) => {
            const td = isToday(d);
            const positioned = positionedByDay[ci];
            return (
              <div key={ci} className={`${styles.dayCol}${td ? ` ${styles.today}` : ''}`}>
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div
                    key={i}
                    className={styles.hourSlot}
                    style={{ height: HOUR_H }}
                    onDoubleClick={() => onDayDbl(fmt(d))}
                  />
                ))}
                {positioned.map(ev => {
                  const top = minToPos(ev.startMin);
                  const height = Math.max((ev.endMin - ev.startMin) / 60 * HOUR_H, 22);
                  const small = height < 40;
                  const colW = 1 / Math.max(ev.totalCols, 1);
                  return (
                    <div
                      key={ev.id}
                      className={styles.weekEvent}
                      onClick={() => onEventEdit(ev.id)}
                      style={{
                        background: evBg(ev),
                        top: top + 1, height: height - 2,
                        left: `calc(${ev.column * colW * 100}% + 2px)`,
                        width: `calc(${colW * 100}% - 4px)`,
                        padding: small ? '3px 6px' : '6px 8px',
                      }}
                    >
                      <div className={styles.weekEventTitle}>{ev.title}</div>
                      {!small && (
                        <div className={styles.weekEventTime}>
                          {fmtTime(ev.start, use24h)}{ev.end ? '→' + fmtTime(ev.end, use24h) : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
WeekView.displayName = 'WeekView';

// ─── DayView ──────────────────────────────────────────────────────────────────

const DayView = memo(({ date, events, use24h, onEventEdit, onHourDbl, notes, onNotesChange }: DayViewProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const evts = useMemo(() => eventsFor(events, date), [events, date]);
  const allDay = evts.filter(e => !e.start);
  const timed = evts.filter(e => e.start);
  const total = evts.length;
  const isCD = isToday(date);
  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });

  useEffect(() => {
    const iv = setInterval(() => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); }, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const targetHour = Math.max(START_HOUR, now.getHours() - 2);
      scrollRef.current.scrollTop = (targetHour - START_HOUR) * HOUR_H;
    }
  }, [date]);

  const balance = useMemo(() => calcBalance(evts), [evts]);
  const focusTime = timed
    .filter(e => classifyEvent(e) === 'work')
    .reduce((acc, e) => {
      const s = timeToMin(e.start!);
      const end = e.end ? timeToMin(e.end) : s + 30;
      return acc + (end - s);
    }, 0);
  const focusHrs = Math.round(focusTime / 60 * 10) / 10;

  const positioned = useMemo(() => {
    const items = timed.map(e => ({
      ...e,
      startMin: timeToMin(e.start!),
      endMin: e.end ? timeToMin(e.end) : timeToMin(e.start!) + 30,
      column: 0,
    }));
    items.forEach((e, i) => {
      let col = 0;
      const overlaps = items.slice(0, i).filter(o => o.startMin < e.endMin && o.endMin > e.startMin);
      if (overlaps.length) { const used = overlaps.map(o => o.column); while (used.includes(col)) col++; }
      e.column = col;
    });
    return items;
  }, [timed]);

  return (
    <div className={styles.dayShell}>
      {/* Header */}
      <div className={styles.dayHeader}>
        <div className={styles.dayDateCard}>
          <div className={styles.dayDateNum}>{date.getDate()}</div>
          <div className={styles.dayDateWeekday}>{DAYS_SHORT[date.getDay()]}</div>
        </div>
        <div className={styles.dayMeta}>
          <div className={styles.dayMetaTitle}>{DAYS_FULL[date.getDay()]}, {MONTHS_FULL[date.getMonth()]} {date.getFullYear()}</div>
          <div className={styles.dayMetaSub}>{total} event{total !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className={styles.dayBody}>
        <div className={styles.dayTimeCol}>
          {/* All-day events */}
          {allDay.length > 0 && (
            <div className={styles.allDayStrip}>
              <div className={styles.allDayStripLabel}>All Day</div>
              <div className={styles.allDayStripEvents}>
                {allDay.map(ev => (
                  <div
                    key={ev.id}
                    className={styles.allDayEvent}
                    style={{ background: evBg(ev) }}
                    onClick={() => onEventEdit(ev.id)}
                  >
                    <span style={{ color: '#fff' }}>{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time grid */}
          <div ref={scrollRef} className={styles.dayScrollGrid}>
            <div className={styles.dayGridInner}>
              <div className={styles.dayHourLabels}>
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div key={i} className={styles.dayHourLabel} style={{ height: HOUR_H }}>
                    {fmtHour(START_HOUR + i, use24h)}
                  </div>
                ))}
              </div>
              <div className={styles.dayEventCol}>
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div
                    key={i}
                    className={styles.dayHourSlot}
                    style={{ height: HOUR_H }}
                    onDoubleClick={() => onHourDbl(START_HOUR + i)}
                  />
                ))}
                {positioned.map(ev => {
                  const top = minToPos(ev.startMin);
                  const height = Math.max((ev.endMin - ev.startMin) / 60 * HOUR_H, 32);
                  const small = height < 50;
                  const leftOff = ev.column * 35;
                  return (
                    <div
                      key={ev.id}
                      className={styles.dayEvent}
                      onClick={() => onEventEdit(ev.id)}
                      style={{
                        background: evBg(ev), top, height,
                        left: 6 + leftOff,
                        width: `calc(100% - ${12 + leftOff}px)`,
                        maxWidth: '65%',
                      }}
                    >
                      <div className={styles.dayEventTitle}>{ev.title}</div>
                      {!small && (
                        <div className={styles.dayEventTime}>
                          {fmtTime(ev.start, use24h)}{ev.end ? ' – ' + fmtTime(ev.end, use24h) : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isCD && nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60 && (
                  <div className={styles.dayNowLine} style={{ top: minToPos(nowMin) }}>
                    <div className={styles.dayNowDot} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.daySidebar}>
          <div className={styles.insightsCard}>
            <div className={styles.insightsHeader}><BoltIcon /> Insights</div>
            <InsightRow icon="🎯" iconBg="rgba(167,139,250,0.1)" iconColor="var(--pc-accent2)">
              <strong>{focusHrs}h</strong> deep work
            </InsightRow>
            <InsightRow icon={balance.icon} iconBg="rgba(100,181,246,0.15)" iconColor="#64b5f6">
              {balance.text}
            </InsightRow>
            <InsightRow icon="📊" iconBg="rgba(252,165,165,0.1)" iconColor="#fca5a5" noBorder>
              <strong>{balance.workHrs}h</strong> work · <strong>{balance.leisureHrs}h</strong> chill
            </InsightRow>
          </div>
          <div className={styles.notesCard}>
            <div className={styles.notesLabel}>Notes</div>
            <textarea
              className={styles.notesTextarea}
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Capture thoughts..."
            />
          </div>
        </div>
      </div>
    </div>
  );
});
DayView.displayName = 'DayView';

// ─── EventModal ───────────────────────────────────────────────────────────────

const EventModal = ({ open, editing, form, onFormChange, onSave, onDelete, onClose }: EventModalProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const isTimed = !!form.startTime;

  useEffect(() => { if (open) setTimeout(() => titleRef.current?.focus(), 150); }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <div className={`${styles.modalOverlay}${open ? ` ${styles.open}` : ''}`} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{editing ? 'Edit Event' : 'New Event'}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Title */}
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Title</label>
            <input
              ref={titleRef}
              type="text"
              className={styles.modalInput}
              value={form.title}
              onChange={e => onFormChange({ title: e.target.value })}
              placeholder="What's happening?"
              onKeyDown={e => { if (e.key === 'Enter' && form.title.trim()) onSave(); }}
            />
          </div>

          {/* Dates */}
          <div className={styles.modalGrid2}>
            <div>
              <label className={styles.modalLabel}>Start Date</label>
              <input type="date" className={styles.modalInput} value={form.date} onChange={e => onFormChange({ date: e.target.value })} />
            </div>
            <div>
              <label className={styles.modalLabel}>End Date</label>
              <div className={styles.modalInputWrap}>
                <input
                  type="date"
                  className={styles.modalInput}
                  value={form.dateEnd}
                  onChange={e => onFormChange({ dateEnd: e.target.value })}
                  style={{ paddingRight: form.dateEnd ? '32px' : '12px' }}
                />
                {form.dateEnd && (
                  <button className={styles.modalClear} onClick={() => onFormChange({ dateEnd: '' })}>×</button>
                )}
              </div>
            </div>
          </div>

          {/* Time toggle */}
          <div>
            <div className={styles.timeToggleRow}>
              <label className={styles.modalLabel}>Time</label>
              <div className={styles.timeToggleWrap}>
                <span className={styles.timeToggleLabel}>{isTimed ? 'Timed' : 'All day'}</span>
                <div
                  className={`${styles.timeToggle}${isTimed ? ` ${styles.active}` : ''}`}
                  onClick={() => onFormChange(isTimed ? { startTime: '', endTime: '' } : { startTime: '09:00', endTime: '10:00' })}
                >
                  <div className={`${styles.timeToggleThumb}${isTimed ? ` ${styles.active}` : ''}`} />
                </div>
              </div>
            </div>
            {isTimed && (
              <div className={styles.modalGrid2}>
                <div>
                  <label className={styles.modalLabel}>Start Time</label>
                  <input type="time" className={styles.modalInput} value={form.startTime} onChange={e => onFormChange({ startTime: e.target.value })} />
                </div>
                <div>
                  <label className={styles.modalLabel}>End Time</label>
                  <div className={styles.modalInputWrap}>
                    <input
                      type="time"
                      className={styles.modalInput}
                      value={form.endTime}
                      onChange={e => onFormChange({ endTime: e.target.value })}
                      style={{ paddingRight: form.endTime ? '32px' : '12px' }}
                    />
                    {form.endTime && (
                      <button className={styles.modalClear} onClick={() => onFormChange({ endTime: '' })}>×</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Repeat + Category */}
          <div className={styles.modalGrid2}>
            <div>
              <label className={styles.modalLabel}>Repeat</label>
              <select className={styles.modalInput} value={form.recur} onChange={e => onFormChange({ recur: e.target.value })}>
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className={styles.modalLabel}>Category</label>
              <div className={styles.colorGrid}>
                {COLOR_OPTIONS.map(c => (
                  <div
                    key={c.tag}
                    className={`${styles.colorSwatch}${form.tag === c.tag ? ` ${styles.selected}` : ''}`}
                    style={{ background: TAG_COLORS[c.tag] }}
                    title={c.label}
                    onClick={() => onFormChange({ tag: c.tag })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          {editing && (
            <button className={styles.deleteBtn} onClick={onDelete} title="Delete event">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete
            </button>
          )}
          <PrivacyToggle isPublic={form.isPublic ?? false} onChange={v => onFormChange({ isPublic: v })} />
          <button
            className={styles.saveBtn}
            onClick={onSave}
            disabled={!form.title.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PulsarCalendar (main) ────────────────────────────────────────────────────

export default function PulsarCalendar() {
  const [view, setView] = useState<CalendarView>('week');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(new Date().getDate());
  const storeEvents = useProductivityStore(s => s.events);
  const storeAddEvent = useProductivityStore(s => s.addEvent);
  const storeUpdateEvent = useProductivityStore(s => s.updateEvent);
  const storeDeleteEvent = useProductivityStore(s => s.deleteEvent);
  const events = useMemo<CalEvent[]>(() => storeEvents.map(e => ({
    id: String(e.id),
    title: e.title,
    date: e.date,
    dateEnd: e.dateEnd ?? null,
    start: e.startTime ?? null,
    end: e.endTime ?? null,
    tag: (e.tag || 'default') as EventTag,
    recur: (e.recur ?? null) as RecurRule,
    isPublic: e.isPublic ?? false,
  })), [storeEvents]);
  const [use24h, setUse24h] = useState(true);
  const [anim, setAnim] = useState<CalendarAnim>('');
  const [animKey, setAnimKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [form, setForm] = useState<CalEventForm>({
    title: '', date: fmt(new Date()), dateEnd: '', startTime: '', endTime: '', tag: 'default', recur: '', isPublic: false,
  });
  // Cross-module: overlay task due dates and goal deadlines as calendar events
  const storeTasks = useProductivityStore(s => s.tasks)
  const storeGoals = useProductivityStore(s => s.goals)
  const crossModuleEvents = useMemo<CalEvent[]>(() => {
    const derived: CalEvent[] = []
    storeTasks.forEach(t => {
      if (t.dueDate && !t.completed) {
        derived.push({ id: `task-${t.id}`, title: `📋 ${t.title}`, date: t.dueDate, dateEnd: null, start: null, end: null, tag: 'work' as EventTag, recur: null })
      }
    })
    storeGoals.forEach(g => {
      if (g.deadline && !g.done) {
        derived.push({ id: `goal-${g.id}`, title: `🎯 ${g.title}`, date: g.deadline, dateEnd: null, start: null, end: null, tag: 'personal' as EventTag, recur: null })
      }
    })
    return derived
  }, [storeTasks, storeGoals])

  // Merge local events with cross-module overlay events
  const allEvents = useMemo(() => [...events, ...crossModuleEvents], [events, crossModuleEvents])

  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notes, setNotes] = useState('');
  const notesStore = useRef<Record<string, string>>({});

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tabBg, setTabBg] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const idx = CALENDAR_VIEWS.indexOf(view);
    const el = tabRefs.current[idx];
    if (el) setTabBg({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view]);

  // Day notes
  useEffect(() => {
    const ds = fmt(new Date(year, month, day));
    setNotes(notesStore.current[ds] || '');
  }, [year, month, day]);

  const saveNotes = useCallback((v: string) => {
    setNotes(v);
    const ds = fmt(new Date(year, month, day));
    notesStore.current[ds] = v;
  }, [year, month, day]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const doAnim = useCallback((a: CalendarAnim) => {
    setAnim(a); setAnimKey(k => k + 1);
    setTimeout(() => setAnim(''), 350);
  }, []);

  const nav = useCallback((dir: number) => {
    doAnim(dir > 0 ? 'slide-left' : 'slide-right');
    if (view === 'year') setYear(y => y + dir);
    else if (view === 'month') {
      setMonth(m => {
        let nm = m + dir;
        if (nm > 11) { setYear(y => y + 1); nm = 0; }
        else if (nm < 0) { setYear(y => y - 1); nm = 11; }
        return nm;
      });
    } else if (view === 'week') {
      const ws = weekStart(new Date(year, month, day));
      ws.setDate(ws.getDate() + dir * 7);
      setYear(ws.getFullYear()); setMonth(ws.getMonth()); setDay(ws.getDate());
    } else {
      const d = new Date(year, month, day);
      d.setDate(d.getDate() + dir);
      setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate());
    }
  }, [view, year, month, day, doAnim]);

  const goToday = useCallback(() => {
    const t = new Date();
    doAnim('zoom-in');
    setYear(t.getFullYear()); setMonth(t.getMonth()); setDay(t.getDate());
    setView('day');
  }, [doAnim]);

  const switchView = useCallback((v: CalendarView) => {
    const oldIdx = CALENDAR_VIEWS.indexOf(view);
    const newIdx = CALENDAR_VIEWS.indexOf(v);
    doAnim(newIdx > oldIdx ? 'zoom-in' : 'zoom-out');
    setView(v);
  }, [view, doAnim]);

  const openCreate = useCallback((dateStr?: string, time?: string) => {
    setEditingEvent(null);
    setForm({ title: '', date: dateStr || fmt(new Date(year, month, day)), dateEnd: '', startTime: time || '', endTime: '', tag: 'default', recur: '', isPublic: false });
    setModalOpen(true);
  }, [year, month, day]);

  const openEdit = useCallback((id: string) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    setEditingEvent(ev);
    setForm({ title: ev.title, date: ev.date, dateEnd: ev.dateEnd || '', startTime: ev.start || '', endTime: ev.end || '', tag: ev.tag, recur: ev.recur || '', isPublic: ev.isPublic ?? false });
    setModalOpen(true);
  }, [events]);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return;
    if (editingEvent) {
      const orig = storeEvents.find(e => e.id === editingEvent.id);
      if (orig) storeUpdateEvent({ ...orig, title: form.title.trim(), date: form.date, dateEnd: form.dateEnd || null, startTime: form.startTime || null, endTime: form.endTime || null, tag: form.tag, recur: form.recur || null, isPublic: form.isPublic });
      showToast('Updated');
    } else {
      storeAddEvent({ title: form.title.trim(), date: form.date, dateEnd: form.dateEnd || null, startTime: form.startTime || null, endTime: form.endTime || null, tag: form.tag, recur: form.recur || null, isPublic: form.isPublic });
      showToast('Created');
    }
    setModalOpen(false); doAnim('zoom-in');
  }, [form, editingEvent, storeEvents, storeAddEvent, storeUpdateEvent, showToast, doAnim]);

  const handleDelete = useCallback(() => {
    if (editingEvent) storeDeleteEvent(editingEvent.id);
    setModalOpen(false); showToast('Deleted'); doAnim('zoom-out');
  }, [editingEvent, storeDeleteEvent, showToast, doAnim]);

  const handleDayClick = useCallback((d: Date) => {
    setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate());
    if (view === 'year') { doAnim('zoom-in'); setView('month'); }
    else if (view === 'month') { doAnim('zoom-in'); setView('week'); }
    else if (view === 'week') { doAnim('zoom-in'); setView('day'); }
  }, [view, doAnim]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modalOpen) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.shiftKey) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); nav(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); nav(1); return; }
        return;
      }
      if (e.key === '1') switchView('year');
      else if (e.key === '2') switchView('month');
      else if (e.key === '3') switchView('week');
      else if (e.key === '4') switchView('day');
      else if (e.key.toLowerCase() === 't') goToday();
      else if (e.key.toLowerCase() === 'n') { e.preventDefault(); openCreate(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, nav, switchView, goToday, openCreate]);

  const headerTitle = useMemo(() => {
    if (view === 'year') return { main: String(year), sub: '' };
    if (view === 'month') return { main: MONTHS_FULL[month], sub: String(year) };
    if (view === 'week') {
      const ws = weekStart(new Date(year, month, day));
      return { main: `${MONTHS_SHORT[ws.getMonth()]} ${ws.getDate()}`, sub: String(ws.getFullYear()) };
    }
    return { main: `${MONTHS_FULL[month]} ${day}`, sub: String(year) };
  }, [view, year, month, day]);

  const animClass = anim ? ` ${styles[`anim${anim.split('-').map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1)).join('')}`]}` : '';

  return (
    <div className={styles.root} style={ROOT_VARS}>
      <div className={styles.shell}>

        {/* Header */}
        <header className={styles.header}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([{ icon: <ChevL />, dir: -1 }, { icon: <ChevR />, dir: 1 }] as const).map(({ icon, dir }, i) => (
              <button key={i} className={styles.navBtn} onClick={() => nav(dir)}>{icon}</button>
            ))}
          </div>
          <h1 className={styles.headerTitle}>
            {headerTitle.main}
            {headerTitle.sub && <span className={styles.headerSub}>{headerTitle.sub}</span>}
          </h1>
          <div className={styles.headerSpacer} />
          <Clock use24h={use24h} onToggle={() => setUse24h(v => !v)} />
          <div className={styles.tabs}>
            <div
              className={styles.tabIndicator}
              style={{ left: tabBg.left, width: tabBg.width }}
            />
            {CALENDAR_VIEWS.map((v, i) => (
              <button
                key={v}
                ref={el => { tabRefs.current[i] = el; }}
                className={`${styles.tab}${view === v ? ` ${styles.active}` : ''}`}
                onClick={() => switchView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.todayBtn} onClick={goToday}>Today</button>
          <button className={styles.newBtn} onClick={() => openCreate()}>
            <PlusIcon /> New
          </button>
        </header>

        {/* Main */}
        <main className={styles.main}>
          <div key={animKey} className={`${styles.viewPane}${animClass}`}>
            {view === 'year' && (
              <YearView year={year} events={allEvents} onMonthClick={m => { doAnim('zoom-in'); setMonth(m); setView('month'); }} />
            )}
            {view === 'month' && (
              <MonthView year={year} month={month} events={allEvents} use24h={use24h} onDayClick={handleDayClick} onDayDbl={ds => openCreate(ds)} onEventEdit={openEdit} />
            )}
            {view === 'week' && (
              <WeekView date={new Date(year, month, day)} events={allEvents} use24h={use24h} onDayClick={handleDayClick} onDayDbl={ds => openCreate(ds)} onEventEdit={openEdit} />
            )}
            {view === 'day' && (
              <DayView date={new Date(year, month, day)} events={allEvents} use24h={use24h} onEventEdit={openEdit} onHourDbl={hr => openCreate(fmt(new Date(year, month, day)), `${String(hr).padStart(2, '0')}:00`)} notes={notes} onNotesChange={saveNotes} />
            )}
          </div>
        </main>
      </div>

      <EventModal open={modalOpen} editing={editingEvent} form={form} onFormChange={p => setForm(f => ({ ...f, ...p }))} onSave={handleSave} onDelete={handleDelete} onClose={() => setModalOpen(false)} />

      {/* Toast */}
      <div className={`${styles.toast}${toastMsg ? ` ${styles.visible}` : ''}`}>
        {toastMsg}
      </div>
    </div>
  );
}
