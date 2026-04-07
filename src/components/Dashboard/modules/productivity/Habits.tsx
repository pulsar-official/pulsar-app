'use client'
import { useState, useMemo, useCallback } from 'react'
import styles from './Habits.module.scss'
import { useProductivityStore } from '@/stores/productivityStore'
import HabitGrid from './HabitGrid'
import HabitProgressChart from './HabitProgressChart'
import HabitTopCard from './HabitTopCard'
import HabitCreateModal from './HabitCreateModal'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function dateToString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Habits() {
  // Store selectors
  const habits = useProductivityStore(s => s.habits)
  const habitChecks = useProductivityStore(s => s.habitChecks)
  const storeAddHabit = useProductivityStore(s => s.addHabit)
  const storeToggleCheck = useProductivityStore(s => s.toggleHabitCheck)

  // Local state
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Get today's date as string (YYYY-MM-DD)
  const todayDate = useMemo(() => dateToString(new Date()), [])

  // Get first day of selected month as string (YYYY-MM-01)
  const monthStartDate = useMemo(() => {
    return dateToString(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1))
  }, [selectedMonth])

  // Handlers
  const handlePrevMonth = useCallback(() => {
    setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }, [])

  const handleToggleHabit = useCallback((habitId: string, date: string) => {
    storeToggleCheck(habitId, date)
  }, [storeToggleCheck])

  const handleCreateHabit = useCallback(async (habit: { name: string; emoji: string }) => {
    await storeAddHabit({
      name: habit.name,
      emoji: habit.emoji,
      isPublic: false,
      category: 'health',
      frequency: 'daily',
    })
  }, [storeAddHabit])

  return (
    <div className={styles.wrap}>
      {/* Header: month navigation + new habit button */}
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={handlePrevMonth}>
            &#8249;
          </button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </span>
          <button className={styles.navBtn} onClick={handleNextMonth}>
            &#8250;
          </button>
        </div>
        <button className={styles.addBtn} onClick={() => setShowCreateModal(true)}>
          + New habit
        </button>
      </div>

      {/* Main Habit Grid (30-day view from month start) */}
      <div className={styles.gridCard}>
        <HabitGrid
          habits={habits}
          habitChecks={habitChecks}
          startDate={monthStartDate}
          todayDate={todayDate}
          onToggle={handleToggleHabit}
        />
      </div>

      {/* Bottom Panel: Chart (left) + Top Habit (right) */}
      <div className={styles.bottomPanel}>
        <div className={styles.chartCard}>
          <HabitProgressChart
            habits={habits}
            habitChecks={habitChecks}
            startDate={monthStartDate}
          />
        </div>
        <HabitTopCard
          habits={habits}
          habitChecks={habitChecks}
          todayDate={todayDate}
          startDate={monthStartDate}
        />
      </div>

      {/* Create Habit Modal */}
      <HabitCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateHabit}
      />
    </div>
  )
}
