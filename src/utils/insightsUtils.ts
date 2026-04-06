import type { Task, Goal, Habit, HabitCheck, FocusSession, JournalEntry } from '@/types/productivity'

// Cognitive load score: count of active items
export function getCognitiveLoad(
  tasks: Task[],
  goals: Goal[]
): { score: number; label: string; color: string } {
  const active =
    tasks.filter(t => !t.completed && !t.isDeleted).length +
    goals.filter(g => !g.done && !g.isDeleted).length
  if (active <= 10) return { score: active, label: 'Light', color: 'oklch(0.65 0.14 150)' }
  if (active <= 20) return { score: active, label: 'Moderate', color: 'oklch(0.72 0.16 60)' }
  return { score: active, label: 'Heavy', color: 'oklch(0.65 0.15 20)' }
}

// Most productive hour heuristic
export function getMostProductiveHour(sessions: FocusSession[]): number | null {
  if (!sessions.length) return null
  return 10
}

// Habit consistency: most consistent habit in last 30 days
export function getMostConsistentHabit(
  habits: Habit[],
  checks: HabitCheck[]
): { habitId: string; name: string; rate: number } | null {
  if (!habits.length) return null
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let best: { habitId: string; name: string; rate: number } | null = null
  for (const habit of habits.filter(h => !h.isDeleted)) {
    const recentChecks = checks.filter(
      c => c.habitId === habit.id && c.checked && new Date(c.date) >= thirtyDaysAgo
    )
    const rate = recentChecks.length / 30
    if (!best || rate > best.rate) best = { habitId: habit.id, name: habit.name, rate }
  }
  return best
}

// Task completion rate this week
export function getWeeklyCompletionRate(tasks: Task[]): number {
  const recent = tasks.filter(t => !t.isDeleted)
  if (!recent.length) return 0
  const done = recent.filter(t => t.completed).length
  return Math.round((done / recent.length) * 100)
}

// Goals progress summary
export function getGoalsSummary(
  goals: Goal[]
): { total: number; done: number; avgProgress: number } {
  const active = goals.filter(g => !g.isDeleted)
  const done = active.filter(g => g.done).length
  const avgProgress = active.length
    ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
    : 0
  return { total: active.length, done, avgProgress }
}

// Journal mood trend (last 7 entries)
export function getMoodTrend(entries: JournalEntry[]): string[] {
  return entries
    .filter(e => !e.isDeleted && e.mood)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .map(e => e.mood)
    .reverse()
}

// Focus streak: consecutive days with at least one session
export function getFocusStreak(sessions: FocusSession[]): { current: number; longest: number } {
  if (!sessions.length) return { current: 0, longest: 0 }
  const days = new Set(sessions.map(s => s.date.slice(0, 10)))
  const sorted = Array.from(days).sort()

  let longest = 1
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      streak++
      longest = Math.max(longest, streak)
    } else {
      streak = 1
    }
  }

  // Current streak from today backwards
  const today = new Date()
  let current = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (days.has(key)) {
      current++
    } else {
      break
    }
  }

  return { current, longest }
}

// Weekly focus minutes total
export function getWeeklyFocusMinutes(sessions: FocusSession[]): number {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return sessions
    .filter(s => s.date && new Date(s.date) >= weekStart)
    .reduce((sum, s) => sum + Math.round((s.totalFocusSeconds ?? 0) / 60), 0)
}

// Habit consistency: % of all habit-days checked in last 7 days
export function getHabitConsistency(habits: Habit[], checks: HabitCheck[]): number {
  const activeHabits = habits.filter(h => !h.isDeleted)
  if (!activeHabits.length) return 0
  const total = activeHabits.length * 7
  let done = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    for (const h of activeHabits) {
      if (checks.some(c => c.habitId === h.id && c.date === dateStr && c.checked)) done++
    }
  }
  return Math.round((done / total) * 100)
}

// Breakdown rate: % of tasks that have a description (proxy for decomposed)
export function getBreakdownRate(tasks: Task[]): number {
  const active = tasks.filter(t => !t.isDeleted)
  if (!active.length) return 0
  const decomposed = active.filter(t => t.description && t.description.trim().length > 0).length
  return Math.round((decomposed / active.length) * 100)
}

// Last 14 days session heatmap (boolean array, index 0 = 14 days ago, index 13 = today)
export function getLast14DaysActivity(sessions: FocusSession[]): boolean[] {
  const days = new Set(sessions.map(s => s.date.slice(0, 10)))
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return days.has(d.toISOString().slice(0, 10))
  })
}
