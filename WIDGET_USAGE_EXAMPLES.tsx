/**
 * WIDGET USAGE EXAMPLES
 *
 * This file demonstrates how to use HabitChecklist and HabitChartWidget
 * components in your application.
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASIC USAGE - WITH WIDGET CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react'
import { WidgetContainer } from '@/components/Dashboard/Corespace'
import HabitChecklist from '@/components/Dashboard/widgets/HabitChecklist'
import HabitChartWidget from '@/components/Dashboard/widgets/HabitChartWidget'

/**
 * Example 1: Using widgets in a Corespace-style layout
 */
export function CorespaceWidgetsExample() {
  const tier = 'atom' as const // or get from useUserTier()

  return (
    <div>
      {/* HabitChecklist Widget */}
      <WidgetContainer
        id="habitChecklist"
        title="Habits Today"
        tier="atom"
        userTier={tier}
        defaultW={4}
        defaultH={5}
      >
        <HabitChecklist />
      </WidgetContainer>

      {/* HabitChartWidget with 7-day view */}
      <WidgetContainer
        id="habitChart"
        title="Habit Trends"
        tier="molecule"
        userTier={tier}
        defaultW={6}
        defaultH={3}
      >
        <HabitChartWidget days={7} />
      </WidgetContainer>

      {/* Variant: HabitChartWidget with 14-day view */}
      <WidgetContainer
        id="habitChartExtended"
        title="Monthly Trends"
        tier="molecule"
        userTier={tier}
        defaultW={6}
        defaultH={3}
      >
        <HabitChartWidget days={14} />
      </WidgetContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE USAGE - WITHOUT WIDGET CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example 2: Using HabitChecklist as a standalone component
 */
export function StandaloneHabitChecklist() {
  return (
    <div style={{ width: '400px', height: '500px' }}>
      <HabitChecklist />
    </div>
  )
}

/**
 * Example 3: Using HabitChartWidget as a standalone component
 */
export function StandaloneHabitChart() {
  return (
    <div style={{ width: '500px', height: '300px' }}>
      <HabitChartWidget days={7} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM DATA USAGE - WITH MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

import type { Habit, HabitCheck } from '@/types/productivity'

/**
 * Example 4: Using HabitChecklist with custom data (for testing)
 */
export function HabitChecklistWithMockData() {
  const mockHabits: Habit[] = [
    {
      id: '1',
      orgId: 'org-1',
      userId: 'user-1',
      name: 'Morning Exercise',
      emoji: '🏃',
      sortOrder: 0,
      isPublic: false,
      category: 'health',
      archived: false,
      frequency: 'daily',
    },
    {
      id: '2',
      orgId: 'org-1',
      userId: 'user-1',
      name: 'Read for 30 mins',
      emoji: '📚',
      sortOrder: 1,
      isPublic: false,
      category: 'learning',
      archived: false,
      frequency: 'daily',
    },
    {
      id: '3',
      orgId: 'org-1',
      userId: 'user-1',
      name: 'Meditation',
      emoji: '🧘',
      sortOrder: 2,
      isPublic: false,
      category: 'health',
      archived: false,
      frequency: 'daily',
    },
  ]

  const today = new Date().toISOString().slice(0, 10)

  const mockChecks: HabitCheck[] = [
    {
      id: 'check-1',
      habitId: '1',
      date: today,
      checked: true,
    },
    {
      id: 'check-2',
      habitId: '2',
      date: today,
      checked: false,
    },
    // habitId: '3' has no check for today (uncompleted)
  ]

  const handleCheck = (habitId: string) => {
    console.log(`Habit ${habitId} was checked`)
  }

  return (
    <div style={{ width: '400px', height: '500px' }}>
      <HabitChecklist
        habits={mockHabits}
        habitChecks={mockChecks}
        onCheck={handleCheck}
      />
    </div>
  )
}

/**
 * Example 5: Using HabitChartWidget with custom data (for testing)
 */
export function HabitChartWidgetWithMockData() {
  const mockHabits: Habit[] = [
    {
      id: '1',
      orgId: 'org-1',
      userId: 'user-1',
      name: 'Morning Exercise',
      emoji: '🏃',
      sortOrder: 0,
      isPublic: false,
      category: 'health',
      archived: false,
      frequency: 'daily',
    },
    {
      id: '2',
      orgId: 'org-1',
      userId: 'user-1',
      name: 'Read for 30 mins',
      emoji: '📚',
      sortOrder: 1,
      isPublic: false,
      category: 'learning',
      archived: false,
      frequency: 'daily',
    },
  ]

  // Generate 7 days of checks (50% completion rate)
  const mockChecks: HabitCheck[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)

    // Habit 1: checked every day
    mockChecks.push({
      id: `check-${i}-1`,
      habitId: '1',
      date: dateStr,
      checked: true,
    })

    // Habit 2: checked on even days only
    mockChecks.push({
      id: `check-${i}-2`,
      habitId: '2',
      date: dateStr,
      checked: i % 2 === 0,
    })
  }

  return (
    <div style={{ width: '600px', height: '300px' }}>
      <HabitChartWidget
        habits={mockHabits}
        habitChecks={mockChecks}
        days={7}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED USAGE - WITH CUSTOM STYLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example 6: Using HabitChecklist in a custom container with sizing
 */
export function HabitChecklistWithCustomSizing() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* Small size variant */}
      <div style={{ width: '300px', height: '400px' }}>
        <h3>Small (300x400)</h3>
        <HabitChecklist />
      </div>

      {/* Regular size variant */}
      <div style={{ width: '400px', height: '500px' }}>
        <h3>Regular (400x500)</h3>
        <HabitChecklist />
      </div>

      {/* Large size variant */}
      <div style={{ width: '500px', height: '600px' }}>
        <h3>Large (500x600)</h3>
        <HabitChecklist />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION IN CORESPACE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example 7: Full integration in CorespaceLayout
 *
 * Add this to: src/components/Dashboard/modules/corespace/CorespaceLayout.tsx
 */
export const INTEGRATION_CODE = `
'use client'

import React from 'react'
import { WidgetGrid, WidgetContainer } from '@/components/Dashboard/Corespace'
import { useUserTier } from '@/hooks/useUserTier'
import HabitChecklist from '@/components/Dashboard/widgets/HabitChecklist'
import HabitChartWidget from '@/components/Dashboard/widgets/HabitChartWidget'
import styles from './CorespaceLayout.module.scss'

// In AVAILABLE_WIDGETS constant, add:
const AVAILABLE_WIDGETS = [
  // ... existing widgets ...
  { id: 'habitChecklist',  name: 'Habits — Checklist',    tier: 'atom' },
  { id: 'habitChart',      name: 'Habits — Chart',        tier: 'molecule' },
] as const

// In the WidgetGrid component, add these widgets:
export default function CorespaceLayout() {
  const { tier } = useUserTier()

  return (
    <WidgetGrid cols={12} rowH={80}>
      {/* ... existing widgets ... */}

      {/* NEW: Habit Checklist Widget (4 cols, 5 rows = 400px) */}
      <WidgetContainer
        id="habitChecklist"
        title="Habits Today"
        tier="atom"
        userTier={tier}
        defaultW={4}
        defaultH={5}
      >
        <HabitChecklist />
      </WidgetContainer>

      {/* NEW: Habit Chart Widget (6 cols, 3 rows = 240px) */}
      <WidgetContainer
        id="habitChart"
        title="Habit Trends"
        tier="molecule"
        userTier={tier}
        defaultW={6}
        defaultH={3}
      >
        <HabitChartWidget days={7} />
      </WidgetContainer>

      {/* ... rest of layout ... */}
    </WidgetGrid>
  )
}
`

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE GRID LAYOUT REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Widget Grid Reference (from Corespace):
 *
 * COLUMNS: 12 (CSS Grid)
 * ROW HEIGHT: 80px per row
 *
 * Common widget sizes:
 * - 1 col = 1/12 of width
 * - 1 row = 80px
 *
 * HabitChecklist recommended:
 * - defaultW={4} = 4 columns (1/3 of width)
 * - defaultH={5} = 5 rows (400px height)
 * - Tier: 'atom'
 *
 * HabitChartWidget recommended:
 * - defaultW={6} = 6 columns (1/2 of width)
 * - defaultH={3} = 3 rows (240px height)
 * - Tier: 'molecule' (more advanced)
 *
 * Tier levels (access control):
 * - 'atom': Basic tier
 * - 'molecule': Enhanced features
 * - 'neuron': Advanced analytics
 * - 'quantum': Premium features
 */

// ═══════════════════════════════════════════════════════════════════════════
// TESTING SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test Scenario 1: Empty state (all habits complete)
 */
export function TestEmptyState() {
  const mockHabits: Habit[] = [
    {
      id: '1',
      orgId: 'org-1',
      userId: 'user-1',
      name: 'Exercise',
      emoji: '🏃',
      sortOrder: 0,
      isPublic: false,
      category: 'health',
      archived: false,
      frequency: 'daily',
    },
  ]

  const today = new Date().toISOString().slice(0, 10)

  const mockChecks: HabitCheck[] = [
    {
      id: 'check-1',
      habitId: '1',
      date: today,
      checked: true, // All habits are checked
    },
  ]

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <HabitChecklist habits={mockHabits} habitChecks={mockChecks} />
      {/* Should display: "All done for today! 🎉" */}
    </div>
  )
}

/**
 * Test Scenario 2: Many habits (scroll required)
 */
export function TestManyHabits() {
  const mockHabits: Habit[] = Array.from({ length: 12 }, (_, i) => ({
    id: `habit-${i}`,
    orgId: 'org-1',
    userId: 'user-1',
    name: `Habit ${i + 1}`,
    emoji: String.fromCharCode(0x1f300 + i), // Various emojis
    sortOrder: i,
    isPublic: false,
    category: 'health',
    archived: false,
    frequency: 'daily',
  }))

  const mockChecks: HabitCheck[] = [] // None checked

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <HabitChecklist habits={mockHabits} habitChecks={mockChecks} />
      {/* Should show scrollbar with 12 habits listed */}
    </div>
  )
}

/**
 * Test Scenario 3: Chart with varied completion rates
 */
export function TestVariedCompletion() {
  const mockHabits: Habit[] = [
    { id: '1', orgId: 'o', userId: 'u', name: 'A', emoji: '🏃', sortOrder: 0, isPublic: false, category: 'health', archived: false, frequency: 'daily' },
    { id: '2', orgId: 'o', userId: 'u', name: 'B', emoji: '📚', sortOrder: 1, isPublic: false, category: 'health', archived: false, frequency: 'daily' },
    { id: '3', orgId: 'o', userId: 'u', name: 'C', emoji: '🧘', sortOrder: 2, isPublic: false, category: 'health', archived: false, frequency: 'daily' },
  ]

  const mockChecks: HabitCheck[] = []
  const today = new Date()

  // Day 0 (today): 2/3 complete (66%)
  mockChecks.push({ id: '1', habitId: '1', date: today.toISOString().slice(0, 10), checked: true })
  mockChecks.push({ id: '2', habitId: '2', date: today.toISOString().slice(0, 10), checked: true })
  mockChecks.push({ id: '3', habitId: '3', date: today.toISOString().slice(0, 10), checked: false })

  // Day -1: 1/3 complete (33%)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  mockChecks.push({ id: '4', habitId: '1', date: yesterday.toISOString().slice(0, 10), checked: true })
  mockChecks.push({ id: '5', habitId: '2', date: yesterday.toISOString().slice(0, 10), checked: false })
  mockChecks.push({ id: '6', habitId: '3', date: yesterday.toISOString().slice(0, 10), checked: false })

  return (
    <div style={{ width: '500px', height: '300px' }}>
      <HabitChartWidget habits={mockHabits} habitChecks={mockChecks} days={7} />
      {/* Chart should show varying completion rates across days */}
    </div>
  )
}
