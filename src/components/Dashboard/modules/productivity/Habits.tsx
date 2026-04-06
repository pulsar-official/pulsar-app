'use client'
import { useState, useMemo, useCallback } from 'react'
import styles from './Habits.module.scss'
import { useProductivityStore } from '@/stores/productivityStore'
import HabitGrid from './HabitGrid'
import HabitProgressChart from './HabitProgressChart'
import HabitCreateModal from './HabitCreateModal'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
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

      {/* Main Habit Grid (30-day view) */}
      <div className={styles.gridCard}>
        <HabitGrid
          habits={habits}
          habitChecks={habitChecks}
          todayDate={todayDate}
          onToggle={handleToggleHabit}
        />
      </div>

      {/* Bottom section: Progress chart */}
      <div className={styles.bottomRow}>
        <div className={styles.graphCard}>
          <span className={styles.sectionTitle}>Completion Rate</span>
          <HabitProgressChart
            habits={habits}
            habitChecks={habitChecks}
            startDate={todayDate}
          />
        </div>
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
