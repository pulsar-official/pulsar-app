'use client'

import { useMemo, useCallback } from 'react'
import styles from './HabitTopCard.module.scss'
import type { Habit, HabitCheck } from '@/types/productivity'

interface HabitTopCardProps {
  habits: Habit[]
  habitChecks: HabitCheck[]
  todayDate: string
}

export default function HabitTopCard({
  habits,
  habitChecks,
  todayDate,
}: HabitTopCardProps) {
  /* Build check map for O(1) lookups */
  const checkMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const check of habitChecks) {
      const hid = check.habitId
      if (!map[hid]) map[hid] = {}
      map[hid][check.date] = check.checked
    }
    return map
  }, [habitChecks])

  /* Get checked state */
  const isChecked = useCallback(
    (habitId: string, dateStr: string) => checkMap[habitId]?.[dateStr] ?? false,
    [checkMap]
  )

  /* Find first uncompleted habit for today */
  const nextHabit = useMemo(() => {
    return habits.find(h => !isChecked(h.id, todayDate))
  }, [habits, isChecked, todayDate])

  /* Calculate streak for a habit */
  const getStreak = useCallback((habitId: string): number => {
    let streak = 0
    let currentDate = new Date(todayDate + 'T00:00:00')

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (isChecked(habitId, dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [isChecked, todayDate])

  if (!nextHabit) {
    return (
      <div className={styles.card}>
        <div className={styles.allDone}>
          <span className={styles.emoji}>🎉</span>
          <span className={styles.text}>All done!</span>
        </div>
      </div>
    )
  }

  const streak = getStreak(nextHabit.id)

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.emoji}>{nextHabit.emoji}</div>
        <div className={styles.name} title={nextHabit.name}>
          {nextHabit.name}
        </div>
        {streak > 0 && <div className={styles.streak}>{streak}🔥</div>}
      </div>
    </div>
  )
}
