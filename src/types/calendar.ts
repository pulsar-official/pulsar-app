// ─── Primitives ───────────────────────────────────────────────────────────────

export type CalendarView = 'year' | 'month' | 'week' | 'day';

export type CalendarAnim =
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-left'
  | 'slide-right'
  | '';

export type EventTag =
  | 'skill'
  | 'pulsar'
  | 'health'
  | 'work'
  | 'school'
  | 'fun'
  | 'worship'
  | 'personal'
  | 'routine'
  | 'urgent'
  | 'meeting'
  | 'default';

export type RecurRule = 'daily' | 'weekly' | null;

export type EventCategory = 'work' | 'leisure';

// ─── Core Data Model ──────────────────────────────────────────────────────────

export interface CalEvent {
  id: string;
  title: string;
  /** ISO date string YYYY-MM-DD – the start date (or the only date for single-day) */
  date: string;
  /** ISO date string for multi-day end date; null for single-day */
  dateEnd: string | null;
  /** HH:MM 24-hour start time; null = all-day */
  start: string | null;
  /** HH:MM 24-hour end time; null if open-ended */
  end: string | null;
  tag: EventTag;
  recur: RecurRule;
  isPublic?: boolean;
}

// ─── Modal Form State ─────────────────────────────────────────────────────────

export interface CalEventForm {
  title: string;
  /** Start date (YYYY-MM-DD) */
  date: string;
  /** End date (YYYY-MM-DD) – empty string means no end date */
  dateEnd: string;
  /** HH:MM start time – empty string means all-day */
  startTime: string;
  /** HH:MM end time – empty string means no end time */
  endTime: string;
  tag: EventTag;
  recur: string;
  isPublic: boolean;
}

// ─── Computed / Layout ────────────────────────────────────────────────────────

/** A CalEvent enriched with pixel-position data for time-grid rendering */
export interface PositionedEvent extends CalEvent {
  startMin: number;
  endMin: number;
  column: number;
  totalCols: number;
}

/** A CalEvent enriched with spanning column metadata for month/week banners */
export interface SpanningEvent extends CalEvent {
  colStart: number;
  colEnd: number;
  span: number;
  startsThisWeek: boolean;
  endsThisWeek: boolean;
  row: number;
}

/** A single cell in the month grid */
export interface MonthCell {
  date: Date;
  /** true if the cell belongs to an adjacent month (greyed out) */
  ot: boolean;
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface YearViewProps {
  year: number;
  events: CalEvent[];
  onMonthClick: (month: number) => void;
}

export interface MonthViewProps {
  year: number;
  month: number;
  events: CalEvent[];
  use24h: boolean;
  onDayClick: (date: Date) => void;
  onDayDbl: (dateStr: string) => void;
  onEventEdit: (id: string) => void;
}

export interface WeekViewProps {
  date: Date;
  events: CalEvent[];
  use24h: boolean;
  onDayClick: (date: Date) => void;
  onDayDbl: (dateStr: string) => void;
  onEventEdit: (id: string) => void;
}

export interface DayViewProps {
  date: Date;
  events: CalEvent[];
  use24h: boolean;
  onEventEdit: (id: string) => void;
  onHourDbl: (hour: number) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

export interface EventModalProps {
  open: boolean;
  editing: CalEvent | null;
  form: CalEventForm;
  onFormChange: (patch: Partial<CalEventForm>) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export interface ClockProps {
  use24h: boolean;
  onToggle: () => void;
}

export interface ClockDigitProps {
  value: string;
}

export interface InsightRowProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  noBorder?: boolean;
  children: React.ReactNode;
}

export interface ProgressRingProps {
  pct: number;
}

// ─── Day View Balance ─────────────────────────────────────────────────────────

export interface DayBalance {
  workHrs: number;
  leisureHrs: number;
  text: string;
  icon: string;
}
