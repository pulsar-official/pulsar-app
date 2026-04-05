'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './FocusModeOverlay.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { useProductivityStore } from '@/stores/productivityStore'
import { rankTasksByROI } from '@/lib/roi'

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

const CIRC = 2 * Math.PI * 90

export const FocusModeOverlay: React.FC = () => {
  const focusModeActive = useUIStore(s => s.focusModeActive)
  const toggleFocusMode = useUIStore(s => s.toggleFocusMode)
  const tasks = useProductivityStore(s => s.tasks)
  const goals = useProductivityStore(s => s.goals)
  const toggleTask = useProductivityStore(s => s.toggleTask)

  // Default 25 min Pomodoro
  const WORK_MINUTES = 25
  const TOTAL = WORK_MINUTES * 60

  const [timeLeft, setTimeLeft] = useState(TOTAL)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Top ROI task
  const topTask = React.useMemo(() => {
    const ranked = rankTasksByROI(tasks, goals)
    return ranked[0] ?? null
  }, [tasks, goals])

  // Timer tick
  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(intervalRef.current!)
    }
  }, [running, timeLeft > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset timer when overlay opens
  useEffect(() => {
    if (focusModeActive) {
      setTimeLeft(TOTAL)
      setRunning(true)
    } else {
      setRunning(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [focusModeActive]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = useCallback(() => {
    if (topTask) toggleTask(topTask.id)
  }, [topTask, toggleTask])

  if (!focusModeActive) return null

  const progress = (TOTAL - timeLeft) / TOTAL
  const dashOffset = CIRC * (1 - progress)

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        {/* Timer ring */}
        <div className={styles.timerWrap}>
          <svg className={styles.timerSvg} viewBox="0 0 200 200">
            <circle className={styles.timerBg} cx="100" cy="100" r="90" />
            <circle
              className={styles.timerProgress}
              cx="100" cy="100" r="90"
              style={{
                strokeDasharray: CIRC,
                strokeDashoffset: dashOffset,
              }}
            />
          </svg>
          <div className={styles.timerInner}>
            <div className={styles.timerTime}>{fmt(timeLeft)}</div>
            <div className={styles.timerLabel}>
              {timeLeft === 0 ? 'done' : running ? 'focusing' : 'paused'}
            </div>
          </div>
        </div>

        {/* Current task */}
        {topTask && (
          <div className={styles.taskCard}>
            <div className={styles.taskLabel}>Working on</div>
            <div className={styles.taskTitle}>{topTask.title}</div>
            {topTask.roiLabel && (
              <div className={styles.taskRoi}>{topTask.roiLabel}</div>
            )}
            <div className={styles.taskActions}>
              <button className={styles.doneBtn} onClick={handleComplete}>
                Mark done
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={styles.pauseBtn}
            onClick={() => setRunning(!running)}
          >
            {running ? 'Pause' : timeLeft === 0 ? 'Restart' : 'Resume'}
          </button>
          <button className={styles.exitBtn} onClick={toggleFocusMode}>
            Exit Focus Mode
          </button>
        </div>

        <div className={styles.shortcut}>Shift + F to toggle</div>
      </div>
    </div>
  )
}
