import type { FocusSession } from '@/types/productivity'

export type TimerPresetId = 'pomodoro' | 'deepWork' | 'quick' | 'long' | 'custom'

export interface TimerPreset {
  id: TimerPresetId
  label: string
  work: number      // minutes
  rest: number      // minutes
  longRest: number  // minutes
  cycles: number
  description: string
}

export const TIMER_PRESETS: Record<TimerPresetId, TimerPreset> = {
  pomodoro: { id: 'pomodoro', label: 'Pomodoro', work: 25, rest: 5,  longRest: 15, cycles: 4, description: '25 min focus, 5 min break' },
  deepWork: { id: 'deepWork', label: 'Deep Work', work: 90, rest: 18, longRest: 30, cycles: 2, description: '90 min deep focus' },
  quick:    { id: 'quick',    label: 'Quick',     work: 15, rest: 3,  longRest: 10, cycles: 3, description: '15 min sprint' },
  long:     { id: 'long',     label: 'Long',      work: 120, rest: 24, longRest: 30, cycles: 2, description: '2 hour deep dive' },
  custom:   { id: 'custom',   label: 'Custom',    work: 25, rest: 5,  longRest: 15, cycles: 4, description: 'Your own schedule' },
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function calcBreakDuration(workMinutes: number): number {
  return Math.max(1, Math.round(workMinutes / 5))
}

export function calculateStreak(sessions: FocusSession[]): number {
  if (!sessions.length) return 0
  const completedDates = new Set(
    sessions.filter(s => s.completedCycles > 0).map(s => s.date)
  )
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (completedDates.has(ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export function getWeeklyFocusMinutes(sessions: FocusSession[]): number {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return sessions
    .filter(s => new Date(s.date) >= weekAgo)
    .reduce((sum, s) => sum + Math.round(s.totalFocusSeconds / 60), 0)
}

// Heatmap: last 30 days, returns array of { date, minutes }
export function getLast30DaysHeatmap(sessions: FocusSession[]): Array<{ date: string; minutes: number }> {
  const result: Array<{ date: string; minutes: number }> = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const dayTotal = sessions
      .filter(s => s.date === ds)
      .reduce((sum, s) => sum + Math.round(s.totalFocusSeconds / 60), 0)
    result.push({ date: ds, minutes: dayTotal })
  }
  return result
}

export const MOTIVATIONAL_QUOTES = [
  "Deep work is the ability to focus without distraction.",
  "The successful warrior is the average person with laser-like focus.",
  "Concentrate all your thoughts upon the work at hand.",
  "You don't have to be great to start, but you have to start to be great.",
  "Focus is not about saying yes to the thing you have to focus on.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
  "Work hard in silence, let success be your noise.",
  "One reason so few of us achieve what we truly want is that we never direct our focus.",
]

// Alias for backward compat
export const FOCUS_QUOTES = MOTIVATIONAL_QUOTES

export const QUIT_MESSAGES = [
  "Your streak ends if you quit now. Keep going!",
  "You're so close! Just a few more minutes.",
  "Every session builds the habit. Don't break the chain!",
  "Future you will thank you for staying focused.",
]

// Alias for backward compat
export type PresetKey = TimerPresetId
