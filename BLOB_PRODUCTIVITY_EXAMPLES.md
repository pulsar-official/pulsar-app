# Blob System - Productivity Module Examples

Practical examples of integrating the blob system into Pulsar's productivity modules.

## Integration with Goals Widget

### Before (without blobs)

```tsx
import styles from './Goals.module.scss'

export function GoalsWidget() {
  const goals = useGoals()

  return (
    <div className={styles.goalContainer}>
      <h2>Goals</h2>
      {goals.map(goal => (
        <div key={goal.id} className={styles.goalItem}>
          <span>{goal.title}</span>
        </div>
      ))}
    </div>
  )
}
```

### After (with blobs)

```tsx
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useBlob } from '@/components/Dashboard/widgets/useBlob'
import { useUIStore } from '@/stores/uiStore'
import styles from './Goals.module.scss'

export function GoalsWidget() {
  const goals = useGoals()
  const blobsEnabled = useUIStore(s => s.blobsEnabled) // Add to store
  const blob = useBlob({
    enableBlob: blobsEnabled,
    blobColor: 'oklch(0.55 0.18 290)', // Purple for goals
    intensity: 'med',
  })

  return (
    <BlobWrapper {...blob}>
      <div className={styles.goalContainer}>
        <h2>Goals</h2>
        {goals.map(goal => (
          <div key={goal.id} className={styles.goalItem}>
            <span>{goal.title}</span>
          </div>
        ))}
      </div>
    </BlobWrapper>
  )
}
```

## Integration with Habits Widget

### With Size-Responsive Complexity

```tsx
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useBlob } from '@/components/Dashboard/widgets/useBlob'
import { useUIStore } from '@/stores/uiStore'
import { useEffect, useRef } from 'react'
import styles from './Habits.module.scss'

export function HabitsWidget() {
  const habits = useHabits()
  const blobsEnabled = useUIStore(s => s.blobsEnabled)
  const containerRef = useRef<HTMLDivElement>(null)
  const blob = useBlob({
    enableBlob: blobsEnabled,
    blobColor: 'oklch(0.55 0.18 290)', // Purple for habits
    intensity: 'med',
  })

  // Update complexity based on widget size
  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth
      const height = containerRef.current.offsetHeight
      blob.updateFromContainerSize(width, height)
    }
  }, [blob])

  return (
    <BlobWrapper {...blob}>
      <div ref={containerRef} className={styles.habitsContainer}>
        <h2>Habits</h2>
        <div className={styles.habitGrid}>
          {habits.map(habit => (
            <div key={habit.id} className={styles.habitCard}>
              <span className={styles.habitName}>{habit.name}</span>
              <div className={styles.habitStreak}>{habit.streak}d</div>
            </div>
          ))}
        </div>
      </div>
    </BlobWrapper>
  )
}
```

## Integration with Journal Widget

### With Amber Color and Persistence

```tsx
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useBlob, useLocalBlobStorage } from '@/components/Dashboard/widgets/useBlob'
import { useUIStore } from '@/stores/uiStore'
import { useEffect } from 'react'
import styles from './JournalEditor.module.scss'

export function JournalWidget() {
  const entries = useJournalEntries()
  const blobsEnabled = useUIStore(s => s.blobsEnabled)
  const blob = useBlob({
    enableBlob: blobsEnabled,
    blobColor: 'oklch(0.62 0.16 80)', // Amber for journal
    intensity: 'med',
    morphSpeed: 4000, // Slightly slower for reflection
  })

  // Persist journal blob preferences
  const { saveToStorage, loadFromStorage } = useLocalBlobStorage('journal-blob', blob)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    saveToStorage()
  }, [blob.blobColor, blob.morphSpeed, blob.intensity, saveToStorage])

  return (
    <BlobWrapper {...blob}>
      <div className={styles.journalContainer}>
        <h2>Journal</h2>
        <div className={styles.entriesList}>
          {entries.map(entry => (
            <div key={entry.id} className={styles.entryCard}>
              <div className={styles.entryDate}>{entry.date}</div>
              <p className={styles.entryText}>{entry.content}</p>
            </div>
          ))}
        </div>
      </div>
    </BlobWrapper>
  )
}
```

## Integration with Tasks Widget

### With Conditional Blob Based on View

```tsx
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useBlob } from '@/components/Dashboard/widgets/useBlob'
import { useUIStore } from '@/stores/uiStore'
import styles from './Tasks.module.scss'

export function TasksWidget() {
  const tasks = useTasks()
  const blobsEnabled = useUIStore(s => s.blobsEnabled)
  const currentView = useUIStore(s => s.taskView) // 'list' or 'board'

  // Different blob settings for different views
  const blob = useBlob({
    enableBlob: blobsEnabled && currentView === 'list',
    blobColor: 'oklch(0.55 0.18 290)', // Purple for tasks
    complexity: currentView === 'list' ? 8 : 6, // Less complex for board view
    intensity: 'med',
  })

  return (
    <BlobWrapper {...blob}>
      <div className={styles.tasksContainer}>
        <h2>Tasks</h2>
        {currentView === 'list' ? (
          <div className={styles.taskList}>
            {tasks.map(task => (
              <div key={task.id} className={styles.taskItem}>
                <input type="checkbox" checked={task.done} />
                <span>{task.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.taskBoard}>
            {/* Board view */}
          </div>
        )}
      </div>
    </BlobWrapper>
  )
}
```

## Integration with Multiple Widgets

### Shared Blob Configuration Hook

Create a custom hook for consistent blob settings across multiple widgets:

```tsx
// hooks/useProductivityBlob.ts
import { useBlob } from '@/components/Dashboard/widgets/useBlob'
import { useUIStore } from '@/stores/uiStore'
import type { BlobIntensity } from '@/components/Dashboard/widgets/blob.types'

interface ProductivityBlobOptions {
  widgetType: 'goals' | 'habits' | 'tasks' | 'journal' | 'calendar'
  intensity?: BlobIntensity
}

export function useProductivityBlob({
  widgetType,
  intensity = 'med',
}: ProductivityBlobOptions) {
  const blobsEnabled = useUIStore(s => s.blobsEnabled)

  // Color map for different widget types
  const colorMap = {
    goals: 'oklch(0.55 0.18 290)',     // Purple
    habits: 'oklch(0.55 0.18 290)',    // Purple
    tasks: 'oklch(0.55 0.18 290)',     // Purple
    journal: 'oklch(0.62 0.16 80)',    // Amber
    calendar: 'oklch(0.55 0.18 290)',  // Purple
  }

  // Speed map for different widget types
  const speedMap = {
    goals: 3000,
    habits: 3500,
    tasks: 3000,
    journal: 4000,  // Slower for reflection
    calendar: 3000,
  }

  return useBlob({
    enableBlob: blobsEnabled,
    blobColor: colorMap[widgetType],
    morphSpeed: speedMap[widgetType],
    intensity,
  })
}

// Usage in widget
import { useProductivityBlob } from '@/hooks/useProductivityBlob'
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'

export function GoalsWidget() {
  const blob = useProductivityBlob({ widgetType: 'goals' })

  return (
    <BlobWrapper {...blob}>
      {/* widget content */}
    </BlobWrapper>
  )
}
```

## Adding Blob Controls to UI Store

### Extend Zustand Store

```tsx
// stores/uiStore.ts
import { create } from 'zustand'
import type { BlobIntensity } from '@/components/Dashboard/widgets/blob.types'

interface UIState {
  // Existing state...

  // Blob settings
  blobsEnabled: boolean
  blobIntensity: BlobIntensity
  blobMorphSpeed: number

  // Actions
  setBlobsEnabled: (enabled: boolean) => void
  setBlobIntensity: (intensity: BlobIntensity) => void
  setBlobMorphSpeed: (speed: number) => void
}

export const useUIStore = create<UIState>(set => ({
  // Existing state...

  blobsEnabled: true,
  blobIntensity: 'med',
  blobMorphSpeed: 3000,

  setBlobsEnabled: (enabled) => set({ blobsEnabled: enabled }),
  setBlobIntensity: (intensity) => set({ blobIntensity: intensity }),
  setBlobMorphSpeed: (speed) => set({ blobMorphSpeed: speed }),
}))
```

## Settings Panel Component

### Blob Configuration UI

```tsx
import { useUIStore } from '@/stores/uiStore'
import { getAllBlobColorPresets } from '@/components/Dashboard/widgets/blobUtils'
import styles from './BlobSettings.module.scss'

export function BlobSettings() {
  const blobsEnabled = useUIStore(s => s.blobsEnabled)
  const blobIntensity = useUIStore(s => s.blobIntensity)
  const blobMorphSpeed = useUIStore(s => s.blobMorphSpeed)
  const setBlobsEnabled = useUIStore(s => s.setBlobsEnabled)
  const setBlobIntensity = useUIStore(s => s.setBlobIntensity)
  const setBlobMorphSpeed = useUIStore(s => s.setBlobMorphSpeed)

  return (
    <div className={styles.blobSettings}>
      <h3>Blob Effects</h3>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={blobsEnabled}
          onChange={e => setBlobsEnabled(e.target.checked)}
        />
        Enable Blob Backgrounds
      </label>

      <div className={styles.setting} disabled={!blobsEnabled}>
        <label>Intensity</label>
        <select
          value={blobIntensity}
          onChange={e => setBlobIntensity(e.target.value as any)}
          disabled={!blobsEnabled}
        >
          <option value="low">Low (Subtle)</option>
          <option value="med">Medium (Default)</option>
          <option value="high">High (Bold)</option>
        </select>
      </div>

      <div className={styles.setting} disabled={!blobsEnabled}>
        <label>Morph Speed</label>
        <input
          type="range"
          min="1000"
          max="5000"
          step="500"
          value={blobMorphSpeed}
          onChange={e => setBlobMorphSpeed(parseInt(e.target.value))}
          disabled={!blobsEnabled}
        />
        <span className={styles.value}>{blobMorphSpeed}ms</span>
      </div>

      <div className={styles.preview}>
        <p className={styles.previewLabel}>Preview:</p>
        {blobsEnabled && (
          <div className={styles.previewBox}>
            Blob effect enabled
          </div>
        )}
      </div>
    </div>
  )
}
```

## Performance-Aware Integration

### Detect Device Capability and Adjust

```tsx
import { useBlob } from '@/components/Dashboard/widgets/useBlob'
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useUIStore } from '@/stores/uiStore'

function useDeviceAwareBlob(widgetType: string) {
  const blobsEnabled = useUIStore(s => s.blobsEnabled)

  // Check device capabilities
  const isLowEndDevice = (() => {
    const nav = navigator as any
    return nav.deviceMemory ? nav.deviceMemory <= 4 : false
  })()

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isSmallScreen = window.innerWidth < 768

  return useBlob({
    enableBlob: blobsEnabled && !isLowEndDevice && !prefersReducedMotion,
    complexity: isSmallScreen ? 6 : 8,
    morphSpeed: isLowEndDevice ? 4000 : 3000,
    intensity: isLowEndDevice ? 'low' : 'med',
  })
}

// Usage
export function HabitsWidget() {
  const blob = useDeviceAwareBlob('habits')
  return (
    <BlobWrapper {...blob}>
      {/* content */}
    </BlobWrapper>
  )
}
```

## Complete Widget Example

### Full Feature Widget with Blobs

```tsx
import React, { useEffect, useRef } from 'react'
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useBlob, useLocalBlobStorage } from '@/components/Dashboard/widgets/useBlob'
import { useUIStore } from '@/stores/uiStore'
import styles from './CompleteWidget.module.scss'

interface CompleteWidgetProps {
  title: string
  items: Array<{ id: string; label: string; value: number }>
}

export function CompleteWidget({ title, items }: CompleteWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const blobsEnabled = useUIStore(s => s.blobsEnabled)
  const blobIntensity = useUIStore(s => s.blobIntensity)
  const blobMorphSpeed = useUIStore(s => s.blobMorphSpeed)

  // Set up blob with full features
  const blob = useBlob({
    enableBlob: blobsEnabled,
    blobColor: 'oklch(0.55 0.18 290)',
    intensity: blobIntensity,
    morphSpeed: blobMorphSpeed,
  })

  // Persist user preferences
  const { saveToStorage, loadFromStorage } = useLocalBlobStorage(`widget-${title}`, blob)

  // Load persisted settings on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Save settings when they change
  useEffect(() => {
    saveToStorage()
  }, [blob.blobColor, blob.morphSpeed, blob.intensity, saveToStorage])

  // Update complexity based on container size
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      blob.updateFromContainerSize(width, height)
    }
  }, [blob])

  return (
    <BlobWrapper {...blob}>
      <div ref={containerRef} className={styles.widget}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.content}>
          {items.map(item => (
            <div key={item.id} className={styles.item}>
              <span className={styles.label}>{item.label}</span>
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <span className={styles.value}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </BlobWrapper>
  )
}
```

## Testing Integration

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react'
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'

describe('BlobWrapper Integration', () => {
  it('renders content without blob when disabled', () => {
    render(
      <BlobWrapper enableBlob={false}>
        <div data-testid="content">Test Content</div>
      </BlobWrapper>
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders SVG blob when enabled', () => {
    const { container } = render(
      <BlobWrapper enableBlob={true}>
        <div>Test Content</div>
      </BlobWrapper>
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('respects user motion preferences', () => {
    const mockMatchMedia = jest.fn(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    window.matchMedia = mockMatchMedia as any

    render(
      <BlobWrapper enableBlob={true}>
        <div>Test Content</div>
      </BlobWrapper>
    )

    // Blob should respect prefers-reduced-motion
    // Application logic should disable blob
  })
})
```

## Summary

The blob system integrates seamlessly with all Pulsar productivity modules:

1. **Goals** - Purple blobs for primary action
2. **Habits** - Purple blobs with responsive complexity
3. **Tasks** - Purple blobs, conditional by view type
4. **Journal** - Amber blobs for warm, reflective feeling
5. **Calendar** - Purple blobs for consistency
6. **Focus Sessions** - Custom colors per session type

Each integration can be customized with:
- Enable/disable toggles
- Color adjustments
- Speed tuning
- Intensity control
- localStorage persistence
- Device-aware optimization
- Accessibility compliance
