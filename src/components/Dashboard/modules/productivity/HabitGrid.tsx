'use client'

import { useMemo, useCallback, useRef, useState } from 'react'
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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })

  /* Drag to scroll handlers */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      scrollLeft: wrapperRef.current?.scrollLeft ?? 0,
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !wrapperRef.current) return
    const walk = (e.clientX - dragStart.x) * 1.5
    wrapperRef.current.scrollLeft = dragStart.scrollLeft - walk
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])


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

  /* Generate all days in the month starting from startDate, accounting for leap years */
  const days = useMemo(() => {
    const result: { date: string; dateObj: Date; dayNum: number; dayName: string }[] = []
    // Validate startDate format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return result // Return empty if invalid
    }
    const start = new Date(startDate + 'T00:00:00')
    const year = start.getFullYear()
    const month = start.getMonth()

    // Calculate days in month (accounting for leap years)
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]

    // Generate all days in the month
    for (let i = 0; i < daysInMonth; i++) {
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
      <div className={styles.habitsWrapper}>
        {/* LEFT SECTION: Empty header */}
        <div className={styles.leftSection}>
          <div className={styles.leftHeader} />
        </div>

        {/* RIGHT SECTION: Day headers with empty body */}
        <div
          ref={wrapperRef}
          className={`${styles.rightSection} ${isDragging ? styles.dragging : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header Row */}
          <div className={styles.headerRow}>
            {days.map(day => {
              const state = getCellState(day.date)
              return (
                <div
                  key={day.date}
                  className={`${styles.dayHeader} ${state === 'today' ? styles.dayToday : ''}`}
                >
                  <div className={styles.dayNum}>{day.dayNum}</div>
                  <div className={styles.dayName}>{day.dayName}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.habitsWrapper}>
      {/* LEFT SECTION: Fixed habit names column */}
      <div className={styles.leftSection}>
        <div className={styles.leftHeader} />
        {habits.map((habit, idx) => (
          <div
            key={habit.id}
            className={`${styles.habitRow} ${idx % 2 === 0 ? styles.rowOdd : styles.rowEven}`}
          >
            <div className={styles.habitCell}>
              <div className={styles.habitInfo}>
                <span className={styles.habitEmoji}>{habit.emoji}</span>
                <span className={styles.habitName}>{habit.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT SECTION: Scrollable days and checkboxes */}
      <div
        ref={wrapperRef}
        className={`${styles.rightSection} ${isDragging ? styles.dragging : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header Row */}
        <div className={styles.headerRow}>
          {days.map(day => {
            const state = getCellState(day.date)
            return (
              <div
                key={day.date}
                className={`${styles.dayHeader} ${state === 'today' ? styles.dayToday : ''}`}
              >
                <div className={styles.dayNum}>{day.dayNum}</div>
                <div className={styles.dayName}>{day.dayName}</div>
              </div>
            )
          })}
        </div>

        {/* Habit Rows with Checkboxes */}
        {habits.map((habit, idx) => (
          <div key={habit.id} className={`${styles.habitRow} ${idx % 2 === 0 ? styles.rowOdd : styles.rowEven}`}>
            {days.map(day => {
              const state = getCellState(day.date)
              const checked = isChecked(habit.id, day.date)
              const canCheck = canToggle(day.date)

              return (
                <div
                  key={`${habit.id}-${day.date}`}
                  className={`${styles.checkboxCell} ${state === 'today' ? styles.cellToday : ''}`}
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
  )
}
