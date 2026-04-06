'use client'

import { useMemo, useCallback } from 'react'
import styles from './HabitGrid.module.scss'
import type { Habit, HabitCheck } from '@/types/productivity'

interface HabitGridProps {
  habits: Habit[]
  habitChecks: HabitCheck[]
  todayDate: string
  onToggle: (habitId: string, date: string) => void
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function HabitGrid({
  habits,
  habitChecks,
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

  /* Generate last 30 days from today */
  const days = useMemo(() => {
    const result: { date: string; dateObj: Date; dayNum: number; dayName: string }[] = []
    // Validate todayDate format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(todayDate)) {
      return result // Return empty if invalid
    }
    const today = new Date(todayDate + 'T00:00:00')
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      result.push({
        date: dateStr,
        dateObj: d,
        dayNum: d.getDate(),
        dayName: DAY_NAMES[d.getDay()],
      })
    }
    return result
  }, [todayDate])

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
    <div className={styles.container}>
      {/* Sticky sidebar with habit names */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader} />
        <div className={styles.habitNames}>
          {habits.map(h => (
            <div key={h.id} className={styles.habitName}>
              <span className={styles.habitEmoji}>{h.emoji}</span>
              <span className={styles.habitNameText}>{h.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable grid */}
      <div className={styles.gridScroll}>
        <div className={styles.gridHeader}>
          {days.map(day => {
            const state = getCellState(day.date)
            return (
              <div
                key={day.date}
                className={`${styles.dayCol} ${styles[`dayCol${state === 'today' ? 'Today' : ''}`]}`}
              >
                <div className={styles.dayNum}>{day.dayNum}</div>
                <div className={styles.dayName}>{day.dayName}</div>
              </div>
            )
          })}
        </div>

        <div className={styles.gridBody}>
          {habits.map(habit => (
            <div key={habit.id} className={styles.habitRow}>
              {days.map(day => {
                const state = getCellState(day.date)
                const checked = isChecked(habit.id, day.date)
                const canCheck = canToggle(day.date)

                return (
                  <div
                    key={`${habit.id}-${day.date}`}
                    className={`${styles.gridCell} ${styles[`cellState${state}`]}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCheckboxChange(habit.id, day.date)}
                      disabled={!canCheck}
                      className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''} ${!canCheck ? styles.checkboxDisabled : ''}`}
                      aria-label={`${habit.name} on ${day.date}`}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
