'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './Habits.module.scss'
import { useProductivityStore } from '@/stores/productivityStore'
import HabitGrid from './HabitGrid'
import HabitProgressChart from './HabitProgressChart'
import HabitQuoteCard from './HabitQuoteCard'
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
  const searchParams = useSearchParams()
  const router = useRouter()

  // Store selectors
  const habits = useProductivityStore(s => s.habits)
  const habitChecks = useProductivityStore(s => s.habitChecks)
  const storeAddHabit = useProductivityStore(s => s.addHabit)
  const storeToggleCheck = useProductivityStore(s => s.toggleHabitCheck)

  // Local state
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Open modal if query param is set
  useEffect(() => {
    if (searchParams.get('modal') === 'create') {
      setShowCreateModal(true)
    }
  }, [searchParams])

  // Handler to close modal (clears modal param but keeps time param for re-opening)
  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false)
    // Remove the modal param but keep the page
    const params = new URLSearchParams(searchParams)
    params.delete('modal')
    const query = params.toString()
    router.push(query ? `/dashboard/productivity/habits?${query}` : '/dashboard/productivity/habits')
  }, [router, searchParams])

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
      {/* Header: title on left, month navigation on right */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>Habit Tracker</div>
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

      {/* Bottom Panel: Chart (left) + Quote Card (right) */}
      <div className={styles.bottomPanel}>
        <div className={styles.chartCard}>
          <HabitProgressChart
            habits={habits}
            habitChecks={habitChecks}
            startDate={monthStartDate}
          />
        </div>
        <HabitQuoteCard />
      </div>

      {/* Create Habit Modal */}
      <HabitCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onCreate={handleCreateHabit}
      />
    </div>
  )
}
