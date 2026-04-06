'use client'

import React from 'react'
import { useFocusSession } from '@/hooks/useFocusSession'
import { useUIStore } from '@/stores/uiStore'
import styles from './FocusTimerWidget.module.scss'

const PHASE_LABELS: Record<string, string> = {
  idle:     'Idle',
  work:     'Focus',
  rest:     'Short Break',
  longRest: 'Long Break',
  done:     'Session Complete',
}

const PHASE_COLORS: Record<string, string> = {
  work:     'oklch(0.65 0.18 290)',
  rest:     'oklch(0.65 0.14 150)',
  longRest: 'oklch(0.62 0.16 200)',
  done:     'oklch(0.65 0.14 80)',
  idle:     'oklch(0.55 0.04 260)',
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FocusTimerWidget() {
  const { state, pause, resume } = useFocusSession()
  const setCurrentPage = useUIStore(s => s.setCurrentPage)

  if (!state || state.phase === 'idle') {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>⏱</span>
        <span className={styles.emptyLabel}>No active session</span>
        <button
          className={styles.startBtn}
          onClick={() => setCurrentPage('focus-sessions')}
        >
          Start Focus
        </button>
      </div>
    )
  }

  const progress = state.totalTime > 0
    ? 1 - state.timeLeft / state.totalTime
    : 0
  const phaseColor = PHASE_COLORS[state.phase] ?? PHASE_COLORS.idle
  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase

  return (
    <div className={styles.active}>
      <div className={styles.phaseRow}>
        <span className={styles.phaseLabel} style={{ color: phaseColor }}>
          {phaseLabel}
        </span>
        <span className={styles.cycleLabel}>
          Cycle {state.cycle}/{state.totalCycles}
        </span>
      </div>

      <div className={styles.countdown} style={{ color: phaseColor }}>
        {fmtTime(state.timeLeft)}
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{
            width: `${progress * 100}%`,
            background: phaseColor,
          }}
        />
      </div>

      <div className={styles.controls}>
        {state.phase === 'done' ? (
          <button
            className={styles.controlBtn}
            onClick={() => setCurrentPage('focus-sessions')}
          >
            View Summary
          </button>
        ) : state.running ? (
          <button className={styles.controlBtn} onClick={pause}>
            ⏸ Pause
          </button>
        ) : (
          <button className={styles.controlBtn} onClick={resume}>
            ▶ Resume
          </button>
        )}

        <button
          className={styles.openBtn}
          onClick={() => setCurrentPage('focus-sessions')}
          title="Open Focus Sessions"
        >
          Open ↗
        </button>
      </div>
    </div>
  )
}

export default FocusTimerWidget
