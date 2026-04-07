'use client'

import { useMemo, useCallback } from 'react'
import styles from './HabitTopCard.module.scss'
import type { Habit, HabitCheck } from '@/types/productivity'

interface HabitTopCardProps {
  habits: Habit[]
  habitChecks: HabitCheck[]
  todayDate: string
  startDate: string
}

export default function HabitTopCard({
  habits,
  habitChecks,
  todayDate,
  startDate,
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

  /* Calculate 30 days starting from startDate for monthly view */
  const days = useMemo(() => {
    const result: string[] = []
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return result
    }
    const start = new Date(startDate + 'T00:00:00')
    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      result.push(d.toISOString().split('T')[0])
    }
    return result
  }, [startDate])

  /* Find top habit by completion rate this month */
  const topHabitData = useMemo(() => {
    if (habits.length === 0 || days.length === 0) return null

    let topHabit = null
    let topRate = -1

    for (const habit of habits) {
      const completed = days.filter(d => isChecked(habit.id, d)).length
      const rate = (completed / days.length) * 100
      if (rate > topRate) {
        topRate = rate
        topHabit = habit
      }
    }

    return topHabit ? { habit: topHabit, rate: Math.round(topRate) } : null
  }, [habits, days, isChecked])

  if (!topHabitData) {
    return (
      <div className={styles.card}>
        <div className={styles.placeholder}>—</div>
      </div>
    )
  }

  const { habit, rate } = topHabitData

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.label}>Top This Month</div>
        <div className={styles.emoji}>{habit.emoji}</div>
        <div className={styles.name} title={habit.name}>
          {habit.name}
        </div>
        <div className={styles.rate}>{rate}%</div>
      </div>
    </div>
  )
}
