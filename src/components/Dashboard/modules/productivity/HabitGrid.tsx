'use client'

import { useMemo, useCallback } from 'react'
import styles from './HabitGrid.module.scss'
import type { Habit, HabitCheck } from '@/types/productivity'

interface HabitGridProps {
  habits: Habit[]
  habitChecks: HabitCheck[]
  startDate: string
  todayDate: string
  onToggle: (habitId: string, date: string) => void
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function HabitGrid({
  habits,
  habitChecks,
  startDate,
  todayDate,
  onToggle,
}: HabitGridProps) {
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

  /* Determine if we can toggle (only today) */
  const canToggle = useCallback((dateStr: string) => dateStr === todayDate, [todayDate])

  /* Cell state: 'today', 'past', or 'future' */
  const getCellState = useCallback(
    (dateStr: string): 'today' | 'past' | 'future' => {
      if (dateStr === todayDate) return 'today'
      return dateStr < todayDate ? 'past' : 'future'
    },
    [todayDate]
  )

  /* Generate 30 days starting from startDate */
  const days = useMemo(() => {
    const result: { date: string; dateObj: Date; dayNum: number; dayName: string }[] = []
    // Validate startDate format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return result // Return empty if invalid
    }
    const start = new Date(startDate + 'T00:00:00')
    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      result.push({
        date: dateStr,
        dateObj: d,
        dayNum: d.getDate(),
        dayName: DAY_NAMES[d.getDay()],
      })
    }
    return result
  }, [startDate])

  const handleCheckboxChange = useCallback(
    (habitId: string, dateStr: string) => {
      if (canToggle(dateStr)) {
        onToggle(habitId, dateStr)
      }
    },
    [canToggle, onToggle]
  )

  if (habits.length === 0) {
    return (
      <div className={styles.empty}>
        <span style={{ fontSize: 18, opacity: 0.3 }}>No habits</span>
      </div>
    )
  }

  return (
    <div className={styles.gridWrapper}>
      <table className={styles.grid}>
        {/* Header: Day columns */}
        <thead>
          <tr>
            <th className={styles.headerHabit}></th>
            {days.map(day => {
              const state = getCellState(day.date)
              return (
                <th
                  key={day.date}
                  className={`${styles.dayHeader} ${state === 'today' ? styles.dayToday : ''}`}
                >
                  <div className={styles.dayNum}>{day.dayNum}</div>
                  <div className={styles.dayName}>{day.dayName}</div>
                </th>
              )
            })}
          </tr>
        </thead>

        {/* Body: Habit rows */}
        <tbody>
          {habits.map((habit, idx) => (
            <tr key={habit.id} className={`${styles.habitRow} ${idx % 2 === 0 ? styles.rowOdd : styles.rowEven}`}>
              <td className={styles.habitCell}>
                <div className={styles.habitInfo}>
                  <span className={styles.habitEmoji}>{habit.emoji}</span>
                  <span className={styles.habitName}>{habit.name}</span>
                </div>
              </td>
              {days.map(day => {
                const state = getCellState(day.date)
                const checked = isChecked(habit.id, day.date)
                const canCheck = canToggle(day.date)

                return (
                  <td
                    key={`${habit.id}-${day.date}`}
                    className={`${styles.dayCell} ${state === 'today' ? styles.cellToday : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCheckboxChange(habit.id, day.date)}
                      disabled={!canCheck}
                      className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''} ${!canCheck ? styles.checkboxDisabled : ''}`}
                      aria-label={`${habit.name} on ${day.date}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
