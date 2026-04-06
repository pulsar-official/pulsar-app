'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import styles from './HabitChecklist.module.scss'
import { useProductivityStore } from '@/stores/productivityStore'
import type { Habit, HabitCheck } from '@/types/productivity'

function dk(d: Date) {
  return d.toISOString().slice(0, 10)
}

interface HabitChecklistProps {
  // Optional props for testing/override. If not provided, data comes from store.
  habits?: Habit[]
  habitChecks?: HabitCheck[]
  onCheck?: (habitId: string) => void
}

export const HabitChecklist: React.FC<HabitChecklistProps> = ({
  habits: propHabits,
  habitChecks: propHabitChecks,
  onCheck: propOnCheck,
}) => {
  const storeHabits = useProductivityStore(s => s.habits)
  const storeHabitChecks = useProductivityStore(s => s.habitChecks)
  const storeToggleCheck = useProductivityStore(s => s.toggleHabitCheck)

  // Get today's date fresh on every render (prevents stale date after midnight)
  const TODAY = dk(new Date())

  // Use provided props or fall back to store
  const habits = propHabits ?? storeHabits
  const habitChecks = propHabitChecks ?? storeHabitChecks
  const onCheckClick = propOnCheck ?? ((id: string) => storeToggleCheck(id, TODAY))

  // Build check map: habitId -> date -> checked
  const checkMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const check of habitChecks) {
      const hid = check.habitId
      if (!map[hid]) map[hid] = {}
      map[hid][check.date] = check.checked
    }
    return map
  }, [habitChecks])

  const isChecked = useCallback(
    (habitId: string) => checkMap[habitId]?.[TODAY] ?? false,
    [checkMap]
  )

  // Separate uncompleted and completed
  const { uncompleted, completed } = useMemo(() => {
    const uncompleted: Habit[] = []
    const completed: Habit[] = []

    habits.forEach(h => {
      if (isChecked(h.id)) {
        completed.push(h)
      } else {
        uncompleted.push(h)
      }
    })

    return { uncompleted, completed }
  }, [habits, isChecked])

  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleCheck = useCallback((habitId: string) => {
    setAnimatingId(habitId)
    onCheckClick(habitId)
    // Animation timeout - only update state if still mounted
    setTimeout(() => {
      if (isMountedRef.current) {
        setAnimatingId(null)
      }
    }, 400)
  }, [onCheckClick])

  const allDone = uncompleted.length === 0

  return (
    <div className={styles.widget}>
      {/* Sticky header */}
      <div className={styles.header}>
        <div className={styles.title}>Habits Today</div>
      </div>

      {/* Scrollable content area */}
      <div className={styles.content}>
        {allDone ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎉</div>
            <div className={styles.emptyText}>All done for today!</div>
          </div>
        ) : (
          <>
            {/* Uncompleted habits */}
            <div className={styles.section}>
              {uncompleted.map(habit => (
                <div
                  key={habit.id}
                  className={`${styles.habitItem} ${
                    animatingId === habit.id ? styles.animating : ''
                  }`}
                >
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleCheck(habit.id)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxCustom} />
                  </label>
                  <span className={styles.emoji}>{habit.emoji}</span>
                  <span className={styles.name}>{habit.name}</span>
                </div>
              ))}
            </div>

            {/* Completed habits (if any) */}
            {completed.length > 0 && (
              <div className={styles.completedSection}>
                {completed.map(habit => (
                  <div key={habit.id} className={styles.completedItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleCheck(habit.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom} />
                    </label>
                    <span className={styles.emoji}>{habit.emoji}</span>
                    <span className={styles.name}>{habit.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default HabitChecklist
