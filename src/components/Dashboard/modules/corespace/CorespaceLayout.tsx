'use client'

import React, { useState, useEffect } from 'react'
import { WidgetGrid, WidgetContainer } from '@/components/Dashboard/Corespace'
import { useUserTier } from '@/hooks/useUserTier'
import { useCorespaceStore } from '@/stores/corespaceStore'
import Momentum from './Momentum'
import Pinned from './Pinned'
import QuickCapture from './QuickCapture'
import Inbox from './Inbox'
import Notifications from './Notifications'
import FocusLauncher from './FocusLauncher'
import CalendarWeekWidget from '@/components/Dashboard/widgets/CalendarWeekWidget'
import CalendarAgendaWidget from '@/components/Dashboard/widgets/CalendarAgendaWidget'
import CalendarMonthWidget from '@/components/Dashboard/widgets/CalendarMonthWidget'
import TimeBlockingSuggestion from '@/components/Dashboard/widgets/TimeBlockingSuggestion'
import { InsightCard } from '@/components/Dashboard/widgets/InsightCard'
import { FocusTimerWidget } from '@/components/Dashboard/widgets/FocusTimerWidget'
import DevTierSelector from './DevTierSelector'
import styles from './CorespaceLayout.module.scss'

// All available widgets for the picker
const AVAILABLE_WIDGETS = [
  { id: 'quickCapture',      name: 'Quick Capture',        tier: 'atom' },
  { id: 'focusTimer',        name: 'Focus Timer',          tier: 'atom' },
  { id: 'momentum',          name: 'Momentum / Streak',    tier: 'atom' },
  { id: 'calendarWeek',      name: 'Calendar — Week',      tier: 'atom' },
  { id: 'calendarAgenda',    name: 'Calendar — Agenda',    tier: 'atom' },
  { id: 'calendarMonth',     name: 'Calendar — Month',     tier: 'atom' },
  { id: 'taskListPreview',   name: 'Task List Preview',    tier: 'atom' },
  { id: 'inbox',             name: 'Inbox',                tier: 'atom' },
  { id: 'pinned',            name: 'Pinned',               tier: 'molecule' },
  { id: 'timeBlocking',      name: 'Time Blocking',        tier: 'molecule' },
  { id: 'insightFocus',      name: 'Insight — Focus',      tier: 'neuron' },
  { id: 'insightLoad',       name: 'Insight — Load',       tier: 'neuron' },
  { id: 'insightWeekly',     name: 'Insight — Weekly',     tier: 'neuron' },
  { id: 'focusLauncher',     name: 'Focus Launcher',       tier: 'neuron' },
  { id: 'notifications',     name: 'Notifications',        tier: 'atom' },
] as const

const TIER_COLORS: Record<string, string> = {
  atom:     'oklch(0.55 0.12 260)',
  molecule: 'oklch(0.55 0.14 200)',
  neuron:   'oklch(0.55 0.18 290)',
  quantum:  'oklch(0.65 0.20 0)',
}

// Default visible widgets (5 core widgets shown by default)
const DEFAULT_VISIBLE_WIDGETS = ['quickCapture', 'focusTimer', 'momentum', 'calendarWeek', 'taskListPreview']

export default function CorespaceLayout() {
  const { tier } = useUserTier()
  const [customizeMode, setCustomizeMode] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Corespace</h2>
          <span className={styles.subtitle}>Your personal command center</span>
        </div>
        <div className={styles.headerActions}>
          <DevTierSelector />
          <button
            className={`${styles.customizeBtn} ${customizeMode ? styles.customizeBtnActive : ''}`}
            onClick={() => setCustomizeMode(v => !v)}
          >
            {customizeMode ? '✓ Done' : '⚙ Customize'}
          </button>
          <button
            className={styles.addWidgetBtn}
            onClick={() => setPickerOpen(v => !v)}
          >
            + Add Widget
          </button>
        </div>
      </div>

      {/* Widget picker panel */}
      {pickerOpen && (
        <div className={styles.addWidgetPanel}>
          <div className={styles.pickerHeader}>
            <span className={styles.pickerTitle}>Add a Widget</span>
            <button className={styles.pickerClose} onClick={() => setPickerOpen(false)}>✕</button>
          </div>
          <div className={styles.pickerGrid}>
            {AVAILABLE_WIDGETS.map(w => (
              <div key={w.id} className={styles.widgetPickerItem} title={`Requires ${w.tier}`}>
                <span className={styles.pickerName}>{w.name}</span>
                <span
                  className={styles.pickerTierBadge}
                  style={{ background: TIER_COLORS[w.tier] }}
                >
                  {w.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget grid — shows 5 default widgets + any additional */}
      <WidgetGrid cols={12} rowH={80}>

        {/* Row 1: QuickCapture (1-12) */}
        <QuickCapture />

        {/* Row 2: FocusTimer (1-4) | Momentum (5-8) | --- (9-12) */}
        <WidgetContainer
          id="focusTimer"
          title="Focus Timer"
          tier="atom"
          userTier={tier}
          defaultW={4}
          defaultH={2}
        >
          <FocusTimerWidget />
        </WidgetContainer>

        <Momentum />

        {/* Row 3: CalendarWeek (1-12) */}
        <WidgetContainer
          id="calendarWeek"
          title="This Week"
          tier="atom"
          userTier={tier}
          defaultW={12}
          defaultH={3}
        >
          <CalendarWeekWidget />
        </WidgetContainer>

        {/* Row 4: TaskListPreview (1-12) */}
        <WidgetContainer
          id="taskListPreview"
          title="Tasks"
          tier="atom"
          userTier={tier}
          defaultW={12}
          defaultH={3}
        >
          <div style={{ padding: '1rem', color: 'oklch(0.7 0 0)', fontSize: '0.875rem' }}>
            TaskListPreview — coming soon
          </div>
        </WidgetContainer>

        {/* Additional widgets (hidden by default, added via widget picker) */}

        {/* CalendarAgenda */}
        <WidgetContainer
          id="calendarAgenda"
          title="Agenda"
          tier="atom"
          userTier={tier}
          defaultW={8}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <CalendarAgendaWidget />
        </WidgetContainer>

        {/* CalendarMonth */}
        <WidgetContainer
          id="calendarMonth"
          title="Calendar"
          tier="atom"
          userTier={tier}
          defaultW={8}
          defaultH={4}
          style={{ display: 'none' }}
        >
          <CalendarMonthWidget />
        </WidgetContainer>

        {/* TimeBlocking */}
        <WidgetContainer
          id="timeBlocking"
          title="Time Blocking"
          tier="molecule"
          userTier={tier}
          defaultW={4}
          defaultH={4}
          style={{ display: 'none' }}
        >
          <TimeBlockingSuggestion />
        </WidgetContainer>

        {/* Insight Cards */}
        <WidgetContainer
          id="insightFocus"
          title="Focus Streak"
          tier="neuron"
          userTier={tier}
          defaultW={2}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <InsightCard
            title="Focus Streak"
            value="—"
            subtitle="Days in a row"
            color="purple"
            icon="🔥"
          />
        </WidgetContainer>

        <WidgetContainer
          id="insightLoad"
          title="Cognitive Load"
          tier="neuron"
          userTier={tier}
          defaultW={2}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <InsightCard
            title="Cognitive Load"
            value="—"
            subtitle="Tasks + sessions today"
            color="blue"
            icon="🧠"
          />
        </WidgetContainer>

        <WidgetContainer
          id="insightWeekly"
          title="Weekly Focus"
          tier="neuron"
          userTier={tier}
          defaultW={2}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <InsightCard
            title="Weekly Focus"
            value="—"
            subtitle="Minutes this week"
            color="green"
            icon="⏱️"
          />
        </WidgetContainer>

        {/* FocusLauncher */}
        <WidgetContainer
          id="focusLauncher"
          title="Focus Launcher"
          tier="neuron"
          userTier={tier}
          defaultW={4}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <FocusLauncher />
        </WidgetContainer>

        {/* Notifications */}
        <WidgetContainer
          id="notifications"
          title="Notifications"
          tier="atom"
          userTier={tier}
          defaultW={4}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <Notifications />
        </WidgetContainer>

        {/* Inbox */}
        <WidgetContainer
          id="inbox"
          title="Inbox"
          tier="atom"
          userTier={tier}
          defaultW={12}
          defaultH={3}
          style={{ display: 'none' }}
        >
          <Inbox />
        </WidgetContainer>

        {/* Pinned */}
        <Pinned />

      </WidgetGrid>
    </div>
  )
}
