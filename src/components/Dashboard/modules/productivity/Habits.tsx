'use client'
import { useState, useMemo, useCallback } from 'react'
import styles from './Habits.module.scss'

interface Habit { id: string; name: string; color: string }
type CheckMap = Record<string, Record<string, boolean>>

const COLORS = [
  'oklch(0.55 0.18 290)',
  'oklch(0.65 0.14 150)',
  'oklch(0.62 0.16 80)',
  'oklch(0.65 0.15 20)',
  'oklch(0.60 0.15 220)',
  'oklch(0.62 0.15 310)',
  'oklch(0.65 0.13 180)',
]

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']
const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function dk(d: Date) { return d.toISOString().slice(0, 10) }
const TODAY = dk(new Date())

const SAMPLE: Habit[] = [
  { id: '1', name: 'Morning workout', color: COLORS[1] },
  { id: '2', name: 'Read 30 min',     color: COLORS[0] },
  { id: '3', name: 'Meditate',        color: COLORS[2] },
]

export default function Habits() {
  const [habits, setHabits]       = useState<Habit[]>(SAMPLE)
  const [checks, setChecks]       = useState<CheckMap>({})
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [showAdd, setShowAdd]     = useState(false)
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState(COLORS[0])

  const monthDays = useMemo(() => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    const last = new Date(y, m + 1, 0).getDate()
    return Array.from({ length: last }, (_, i) => new Date(y, m, i + 1))
  }, [viewMonth])

  const prevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const isChecked = useCallback((habitId: string, dateStr: string) =>
    checks[habitId]?.[dateStr] ?? false, [checks])

  const toggle = useCallback((habitId: string) => {
    setChecks(prev => {
      const hMap = prev[habitId] ?? {}
      return { ...prev, [habitId]: { ...hMap, [TODAY]: !(hMap[TODAY] ?? false) } }
    })
  }, [])

  const getCellState = (dateStr: string): 'today' | 'past' | 'future' =>
    dateStr === TODAY ? 'today' : dateStr < TODAY ? 'past' : 'future'

  /* Line chart data — daily completion % for viewed month up to today */
  const chartData = useMemo(() => {
    const days = monthDays.filter(d => dk(d) <= TODAY)
    if (!habits.length || !days.length) return []
    return days.map(d => {
      const ds = dk(d)
      const done = habits.filter(h => isChecked(h.id, ds)).length
      return { day: d.getDate(), pct: done / habits.length }
    })
  }, [monthDays, habits, isChecked])

  /* SVG polyline geometry */
  const chartSvg = useMemo(() => {
    if (chartData.length < 1) return null
    const W = 400, H = 72, PAD = 6
    const pts: [number, number][] = chartData.map((d, i) => [
      PAD + (i / Math.max(chartData.length - 1, 1)) * (W - PAD * 2),
      PAD + (1 - d.pct) * (H - PAD * 2),
    ])
    const polyline = pts.map(p => p.join(',')).join(' ')
    const area = `M${pts[0][0]},${H} ` +
      pts.map(p => `L${p[0]},${p[1]}`).join(' ') +
      ` L${pts[pts.length - 1][0]},${H} Z`
    return { pts, polyline, area, W, H }
  }, [chartData])

  /* Insight: most consistent day of week */
  const insight = useMemo(() => {
    if (!habits.length) return { value: '—', desc: 'Add habits to see insights' }
    const sums = Array(7).fill(0), counts = Array(7).fill(0)
    monthDays.forEach(d => {
      const ds = dk(d)
      if (ds > TODAY) return
      const dow = d.getDay()
      counts[dow]++
      sums[dow] += habits.filter(h => isChecked(h.id, ds)).length / habits.length
    })
    let best = -1, bestPct = -1
    for (let i = 0; i < 7; i++) {
      const rate = counts[i] > 0 ? sums[i] / counts[i] : -1
      if (rate > bestPct) { bestPct = rate; best = i }
    }
    if (bestPct <= 0) return { value: '—', desc: 'Start checking off habits to see insights' }
    return {
      value: `${Math.round(bestPct * 100)}%`,
      desc: `completion rate on ${DOW_NAMES[best]}s — your strongest day this month`,
    }
  }, [habits, monthDays, isChecked])

  const addHabit = () => {
    if (!newName.trim()) return
    setHabits(prev => [...prev, { id: Date.now().toString(), name: newName.trim(), color: newColor }])
    setNewName(''); setNewColor(COLORS[0]); setShowAdd(false)
  }

  return (
    <div className={styles.wrap}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <span className={styles.modLabel}>MODULE</span>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>‹</button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button className={styles.navBtn} onClick={nextMonth}>›</button>
        </div>
        <span className={styles.title}>Habits</span>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add habit</button>
      </div>

      {/* ── Monthly grid ── */}
      <div className={styles.gridWrap}>
        {habits.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 30, opacity: 0.25 }}>◎</span>
            <span>No habits yet — add your first one above</span>
          </div>
        ) : (
          <table className={styles.gridTable}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.thCorner}>Habit</th>
                {monthDays.map(d => {
                  const ds = dk(d)
                  return (
                    <th key={ds} className={`${styles.thDay} ${ds === TODAY ? styles.thToday : ''}`}>
                      <span className={styles.dayNum}>{d.getDate()}</span>
                      <span className={styles.dayName}>{DAY_NAMES[d.getDay()]}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} className={styles.habitRow}>
                  <td className={styles.nameCell}>
                    <span className={styles.habitLabel} style={{ color: habit.color }}>
                      {habit.name}
                    </span>
                  </td>
                  {monthDays.map(d => {
                    const ds = dk(d)
                    const state = getCellState(ds)
                    const checked = isChecked(habit.id, ds)
                    const cls = [
                      styles.circle,
                      state === 'today' && checked  ? styles.circleCheckedToday :
                      state === 'today'             ? styles.circleToday :
                      checked                       ? styles.circleChecked :
                      state === 'past'              ? styles.circlePast :
                                                      styles.circleFuture,
                    ].join(' ')
                    return (
                      <td key={ds} className={styles.cell}>
                        <span
                          className={cls}
                          onClick={state === 'today' ? () => toggle(habit.id) : undefined}
                        >
                          {checked && <span className={styles.checkMark}>✓</span>}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bottom panel ── */}
      <div className={styles.bottom}>

        {/* Line chart */}
        <div className={styles.graphWrap}>
          <span className={styles.graphTitle}>
            Completion · {MONTH_NAMES[viewMonth.getMonth()]}
          </span>
          {chartSvg ? (
            <svg
              className={styles.graphSvg}
              viewBox={`0 0 ${chartSvg.W} ${chartSvg.H}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="habGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.18 290)" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="oklch(0.55 0.18 290)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map(v => {
                const y = 6 + (1 - v) * (chartSvg.H - 12)
                return <line key={v} x1={6} y1={y} x2={chartSvg.W - 6} y2={y}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              })}
              <path d={chartSvg.area} fill="url(#habGrad)" />
              <polyline
                points={chartSvg.polyline}
                fill="none"
                stroke="oklch(0.65 0.16 290)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {chartSvg.pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.5} fill="oklch(0.75 0.16 290)" />
              ))}
            </svg>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', opacity: 0.25, fontSize: 11 }}>
              No data yet
            </div>
          )}
        </div>

        {/* Insight */}
        <div className={styles.insightPanel}>
          <span className={styles.insightBadge}>INSIGHT</span>
          <span className={styles.insightValue}>{insight.value}</span>
          <span className={styles.insightDesc}>{insight.desc}</span>
        </div>
      </div>

      {/* ── Add modal ── */}
      {showAdd && (
        <div className={styles.overlay}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className={styles.modal}>
            <span className={styles.modalTitle}>New habit</span>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                className={styles.input}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Morning workout"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') addHabit() }}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Color</label>
              <div className={styles.colorRow}>
                {COLORS.map(c => (
                  <span
                    key={c}
                    className={`${styles.colorDot} ${newColor === c ? styles.colorDotActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={addHabit}>Add habit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
