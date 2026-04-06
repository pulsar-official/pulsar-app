'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './FocusSessions.module.scss'
import { useFocusSession } from '@/hooks/useFocusSession'
import { useProductivityStore } from '@/stores/productivityStore'
import {
  TIMER_PRESETS,
  formatTime,
  calculateStreak,
  getWeeklyFocusMinutes,
  getLast30DaysHeatmap,
  MOTIVATIONAL_QUOTES,
  QUIT_MESSAGES,
  type TimerPresetId,
} from '@/utils/focusUtils'

// ── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'taskSelect' | 'running' | 'done'

interface QueueTask {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const SVG_SIZE   = 220
const SVG_CENTER = SVG_SIZE / 2
const SVG_R      = 88
const CIRCUMFERENCE = 2 * Math.PI * SVG_R

const PRIORITY_COLORS: Record<string, string> = {
  high:   'oklch(0.65 0.15 20)',
  medium: 'oklch(0.75 0.14 80)',
  low:    'oklch(0.65 0.14 150)',
}

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(' ')
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FocusSessions() {
  const { focusSessions } = useProductivityStore()
  const { tasks } = useProductivityStore()

  const {
    state: session,
    start, pause, resume, stop, skipPhase,
    customWork, setCustomWork,
    customRest, setCustomRest,
    customLongRest, setCustomLongRest,
    customCycles, setCustomCycles,
  } = useFocusSession()

  const [screen, setScreen] = useState<Screen>('home')
  const [selectedPreset, setSelectedPreset] = useState<TimerPresetId>('pomodoro')
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quitMsgIdx] = useState(() => Math.floor(Math.random() * QUIT_MESSAGES.length))

  const streak = calculateStreak(focusSessions ?? [])
  const weeklyMinutes = getWeeklyFocusMinutes(focusSessions ?? [])
  const heatmap = getLast30DaysHeatmap(focusSessions ?? [])

  // Rotate quote every 60s during running
  useEffect(() => {
    if (screen !== 'running') return
    const id = setInterval(() => {
      setQuoteIdx(i => (i + 1) % MOTIVATIONAL_QUOTES.length)
    }, 60_000)
    return () => clearInterval(id)
  }, [screen])

  // Sync to running screen when session starts
  useEffect(() => {
    if (session?.phase === 'work' || session?.phase === 'rest' || session?.phase === 'longRest') {
      if (screen !== 'running') setScreen('running')
    }
    if (session?.phase === 'done') {
      setScreen('done')
    }
  }, [session?.phase])

  // Build task queue from store
  useEffect(() => {
    const incomplete = (tasks ?? [])
      .filter(t => !t.completed)
      .slice(0, 10)
      .map(t => ({ id: t.id, title: t.title, priority: t.priority, done: false }))
    setQueueTasks(incomplete)
  }, [tasks])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleStartSession() {
    setCompletedTaskIds(new Set())
    start(selectedPreset)
    setScreen('running')
  }

  function handleQuit() {
    setShowQuitModal(true)
  }

  function handleConfirmQuit() {
    stop()
    setShowQuitModal(false)
    setScreen('home')
  }

  function toggleTaskDone(id: string) {
    setCompletedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTaskSelect(id: string) {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Progress arc ────────────────────────────────────────────────────────────

  const progress = session
    ? (session.timeLeft / session.totalTime)
    : 1
  const dashOffset = CIRCUMFERENCE * progress

  // ── Phase label ─────────────────────────────────────────────────────────────

  const phaseLabel = session?.phase === 'work'
    ? 'FOCUS'
    : session?.phase === 'rest'
      ? 'SHORT BREAK'
      : session?.phase === 'longRest'
        ? 'LONG BREAK'
        : 'DONE'

  const phaseClass = session?.phase === 'work'
    ? styles.phaseFocus
    : session?.phase === 'rest'
      ? styles.phaseRest
      : styles.phaseLongRest

  // ── Heatmap intensity ────────────────────────────────────────────────────────

  function heatLevel(minutes: number): 0 | 1 | 2 | 3 {
    if (minutes === 0) return 0
    if (minutes < 30) return 1
    if (minutes < 60) return 2
    return 3
  }

  // ── Weekly summary ──────────────────────────────────────────────────────────

  const weekHours = Math.floor(weeklyMinutes / 60)
  const weekMins  = weeklyMinutes % 60

  // ── Selected tasks for running screen ───────────────────────────────────────

  const sessionTasks = queueTasks.filter(t => selectedTaskIds.has(t.id))

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* ── HOME ─────────────────────────────────────────────────────────── */}
      {screen === 'home' && (
        <div className={styles.homeScreen}>
          <div className={styles.homeHeader}>
            <h2 className={styles.homeTitle}>Focus Sessions</h2>
            {streak > 0 && (
              <span className={styles.streakBadge}>🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Weekly summary */}
          <div className={styles.weeklySummary}>
            <span className={styles.weeklyLabel}>This week</span>
            <span className={styles.weeklyValue}>
              {weekHours > 0 ? `${weekHours}h ` : ''}{weekMins}m focused
            </span>
          </div>

          {/* Preset grid */}
          <div className={styles.presetGrid}>
            {(Object.values(TIMER_PRESETS) as typeof TIMER_PRESETS[TimerPresetId][]).map(preset => (
              <button
                key={preset.id}
                className={cx(styles.presetCard, selectedPreset === preset.id && styles.presetCardSelected)}
                onClick={() => setSelectedPreset(preset.id)}
              >
                <span className={styles.presetLabel}>{preset.label}</span>
                <span className={styles.presetTimes}>
                  {preset.work}m / {preset.rest}m
                </span>
                <span className={styles.presetDesc}>{preset.description}</span>
              </button>
            ))}
          </div>

          {/* Custom controls */}
          {selectedPreset === 'custom' && (
            <div className={styles.customPanel}>
              <div className={styles.customRow}>
                <label className={styles.customLabel}>Work</label>
                <input
                  type="number"
                  className={styles.customInput}
                  value={customWork}
                  min={1} max={240}
                  onChange={e => setCustomWork(Number(e.target.value))}
                />
                <span className={styles.customUnit}>min</span>
              </div>
              <div className={styles.customRow}>
                <label className={styles.customLabel}>Rest</label>
                <input
                  type="number"
                  className={styles.customInput}
                  value={customRest}
                  min={1} max={60}
                  onChange={e => setCustomRest(Number(e.target.value))}
                />
                <span className={styles.customUnit}>min</span>
              </div>
              <div className={styles.customRow}>
                <label className={styles.customLabel}>Long Rest</label>
                <input
                  type="number"
                  className={styles.customInput}
                  value={customLongRest}
                  min={1} max={90}
                  onChange={e => setCustomLongRest(Number(e.target.value))}
                />
                <span className={styles.customUnit}>min</span>
              </div>
              <div className={styles.customRow}>
                <label className={styles.customLabel}>Cycles</label>
                <input
                  type="number"
                  className={styles.customInput}
                  value={customCycles}
                  min={1} max={12}
                  onChange={e => setCustomCycles(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className={styles.heatmapSection}>
            <span className={styles.heatmapLabel}>Last 30 days</span>
            <div className={styles.heatmap}>
              {heatmap.map(({ date, minutes }) => (
                <div
                  key={date}
                  className={cx(
                    styles.heatSquare,
                    heatLevel(minutes) === 0 && styles.heatLevel0,
                    heatLevel(minutes) === 1 && styles.heatLevel1,
                    heatLevel(minutes) === 2 && styles.heatLevel2,
                    heatLevel(minutes) === 3 && styles.heatLevel3,
                  )}
                  title={`${date}: ${minutes}m`}
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <button className={styles.ctaBtn} onClick={() => setScreen('taskSelect')}>
            Select Tasks →
          </button>
        </div>
      )}

      {/* ── TASK SELECT ──────────────────────────────────────────────────── */}
      {screen === 'taskSelect' && (
        <div className={styles.taskSelectScreen}>
          <div className={styles.taskSelectHeader}>
            <button className={styles.backBtn} onClick={() => setScreen('home')}>← Back</button>
            <h3 className={styles.taskSelectTitle}>Choose tasks for this session</h3>
          </div>

          {queueTasks.length === 0 ? (
            <p className={styles.noTasks}>No incomplete tasks. You can still start a session.</p>
          ) : (
            <ul className={styles.taskList}>
              {queueTasks.map(task => (
                <li key={task.id} className={styles.taskItem}>
                  <input
                    type="checkbox"
                    className={styles.taskCheckbox}
                    checked={selectedTaskIds.has(task.id)}
                    onChange={() => toggleTaskSelect(task.id)}
                  />
                  <span
                    className={styles.priorityDot}
                    style={{ background: PRIORITY_COLORS[task.priority] }}
                  />
                  <span className={styles.taskTitle}>{task.title}</span>
                </li>
              ))}
            </ul>
          )}

          <button className={styles.ctaBtn} onClick={handleStartSession}>
            Start Session →
          </button>
        </div>
      )}

      {/* ── RUNNING ──────────────────────────────────────────────────────── */}
      {screen === 'running' && session && (
        <div className={styles.runningScreen}>
          {/* Phase label */}
          <div className={cx(styles.phaseLabel, phaseClass)}>{phaseLabel}</div>

          {/* Circular timer */}
          <div className={styles.timerCircle}>
            <svg width={SVG_SIZE} height={SVG_SIZE}>
              {/* Track */}
              <circle
                className={styles.timerTrack}
                cx={SVG_CENTER}
                cy={SVG_CENTER}
                r={SVG_R}
                fill="none"
                strokeWidth={10}
              />
              {/* Arc */}
              <circle
                className={cx(styles.timerArc, phaseClass && styles.timerArcActive)}
                cx={SVG_CENTER}
                cy={SVG_CENTER}
                r={SVG_R}
                fill="none"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${SVG_CENTER} ${SVG_CENTER})`}
              />
            </svg>
            <div className={styles.timerDisplay}>
              <span className={styles.timerTime}>{formatTime(session.timeLeft)}</span>
            </div>
          </div>

          {/* Cycle indicator */}
          <div className={styles.cycleInfo}>
            Cycle {session.cycle} of {session.totalCycles}
          </div>

          {/* Current tasks */}
          {sessionTasks.length > 0 && (
            <div className={styles.sessionTasks}>
              {sessionTasks.map(task => (
                <div
                  key={task.id}
                  className={cx(styles.sessionTask, completedTaskIds.has(task.id) && styles.sessionTaskDone)}
                  onClick={() => toggleTaskDone(task.id)}
                >
                  <span className={styles.sessionTaskCheck}>
                    {completedTaskIds.has(task.id) ? '✓' : '○'}
                  </span>
                  <span className={styles.sessionTaskTitle}>{task.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className={styles.controls}>
            {session.running ? (
              <button className={cx(styles.controlBtn, styles.controlPause)} onClick={pause}>
                Pause
              </button>
            ) : (
              <button className={cx(styles.controlBtn, styles.controlResume)} onClick={resume}>
                Resume
              </button>
            )}
            <button className={cx(styles.controlBtn, styles.controlSkip)} onClick={skipPhase}>
              Skip
            </button>
            <button className={cx(styles.controlBtn, styles.controlQuit)} onClick={handleQuit}>
              Quit
            </button>
          </div>

          {/* Tasks completed */}
          {completedTaskIds.size > 0 && (
            <div className={styles.completedCount}>
              {completedTaskIds.size} task{completedTaskIds.size !== 1 ? 's' : ''} completed
            </div>
          )}

          {/* Rotating quote */}
          <div className={styles.quote}>
            &ldquo;{MOTIVATIONAL_QUOTES[quoteIdx % MOTIVATIONAL_QUOTES.length]}&rdquo;
          </div>
        </div>
      )}

      {/* ── DONE ─────────────────────────────────────────────────────────── */}
      {screen === 'done' && (
        <div className={styles.doneScreen}>
          <div className={styles.doneEmoji}>🎉</div>
          <h2 className={styles.doneTitle}>Session Complete!</h2>

          <div className={styles.doneStats}>
            <div className={styles.doneStat}>
              <span className={styles.doneStatValue}>{session?.totalCycles ?? 0}</span>
              <span className={styles.doneStatLabel}>cycles</span>
            </div>
            <div className={styles.doneStat}>
              <span className={styles.doneStatValue}>{completedTaskIds.size}</span>
              <span className={styles.doneStatLabel}>tasks done</span>
            </div>
            <div className={styles.doneStat}>
              <span className={styles.doneStatValue}>
                {session ? Math.round(session.elapsed / 60) : 0}m
              </span>
              <span className={styles.doneStatLabel}>focused</span>
            </div>
          </div>

          {streak > 0 && (
            <div className={styles.doneStreak}>🔥 {streak} day streak!</div>
          )}

          <div className={styles.doneBtns}>
            <button
              className={cx(styles.ctaBtn)}
              onClick={() => { stop(); setScreen('taskSelect') }}
            >
              Start New Session
            </button>
            <button
              className={cx(styles.ctaBtn, styles.ctaBtnSecondary)}
              onClick={() => { stop(); setScreen('home') }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ── QUIT DETERRENCE MODAL ─────────────────────────────────────────── */}
      {showQuitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.quitModal}>
            <p className={styles.quitWarning}>{QUIT_MESSAGES[quitMsgIdx]}</p>
            {streak > 0 && (
              <p className={styles.quitStreak}>
                You&apos;ll lose your {streak}-day streak!
              </p>
            )}
            <div className={styles.quitBtns}>
              <button
                className={cx(styles.controlBtn, styles.controlResume)}
                onClick={() => { setShowQuitModal(false); if (!session?.running) resume() }}
              >
                Keep Going
              </button>
              <button
                className={cx(styles.controlBtn, styles.controlQuit)}
                onClick={handleConfirmQuit}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
