import type { Habit, HabitCheck } from '@/types/productivity'

/**
 * Calculate the current streak for a habit by counting consecutive days
 * checked going backward from today. Stops at the first gap or non-match.
 */
export function calculateStreak(
  habitId: string,
  habitChecks: HabitCheck[],
  today: Date = new Date()
): number {
  if (!habitChecks.length) return 0

  // Get all checks for this habit, sorted by date descending
  const habitChecksSorted = habitChecks
    .filter(c => c.habitId === habitId && c.checked && !c.isDeleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (!habitChecksSorted.length) return 0

  let streak = 0
  const todayStr = today.toISOString().split('T')[0]
  let currentDate = new Date(todayStr)

  for (const check of habitChecksSorted) {
    const checkDateStr = check.date
    const currentDateStr = currentDate.toISOString().split('T')[0]

    // If this check is on the current date we're looking for, increment streak
    if (checkDateStr === currentDateStr) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (new Date(checkDateStr).getTime() < currentDate.getTime()) {
      // Check is before our current date, so the streak is broken
      break
    }
  }

  return streak
}

/**
 * Calculate completion rate for a specific date.
 * Returns (checked habits / total habits) * 100
 * Returns 0 if there are no habits or if the date has no data.
 */
export function getCompletionRateForDate(
  date: Date,
  habits: Habit[],
  habitChecks: HabitCheck[]
): number {
  if (!habits.length) return 0

  const dateStr = date.toISOString().split('T')[0]
  const checksForDate = habitChecks.filter(
    c => c.date === dateStr && c.checked && !c.isDeleted
  )

  const totalHabits = habits.filter(h => !h.archived && !h.isDeleted).length
  if (!totalHabits) return 0

  return (checksForDate.length / totalHabits) * 100
}

/**
 * Get completion rate data for the last 30 days.
 * Returns array of { date, completionRate } sorted with most recent day first.
 * Used by habit progress charts.
 */
export function getLast30DaysData(
  habits: Habit[],
  habitChecks: HabitCheck[]
): Array<{ date: Date; completionRate: number }> {
  const result: Array<{ date: Date; completionRate: number }> = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const completionRate = getCompletionRateForDate(date, habits, habitChecks)
    result.push({ date, completionRate })
  }

  return result
}

/**
 * Get today's habits with a flag indicating if each has been checked today.
 * Returns habits sorted: unchecked first, then checked.
 * Filters out archived habits.
 */
export function getHabitsForToday(
  habits: Habit[],
  habitChecks: HabitCheck[],
  today: Date = new Date()
): Array<Habit & { isCheckedToday: boolean }> {
  const todayStr = today.toISOString().split('T')[0]

  // Build set of habit IDs that were checked today
  const checkedTodaySet = new Set(
    habitChecks
      .filter(c => c.date === todayStr && c.checked && !c.isDeleted)
      .map(c => c.habitId)
  )

  // Map habits to include checkedToday flag, filter out archived
  const habitsWithFlag = habits
    .filter(h => !h.archived && !h.isDeleted)
    .map(h => ({
      ...h,
      isCheckedToday: checkedTodaySet.has(h.id),
    }))

  // Sort: unchecked first, then checked
  return habitsWithFlag.sort((a, b) => {
    if (a.isCheckedToday === b.isCheckedToday) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    }
    return a.isCheckedToday ? 1 : -1
  })
}

/**
 * Check if a date allows habit check/uncheck operations.
 * Returns true only if the date is today.
 * Used by HabitGrid to disable past/future checkboxes.
 */
export function isCheckAllowedForDate(
  date: Date,
  today: Date = new Date()
): boolean {
  const dateStr = date.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]
  return dateStr === todayStr
}
