'use client'
import { useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react'
import styles from './Habits.module.scss'

/* ── Types ── */
interface Habit { id: string; name: string; color: string }
type CheckMap = Record<string, Record<string, boolean>>

/* ── Constants ── */
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
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dk(d: Date) { return d.toISOString().slice(0, 10) }
const TODAY = dk(new Date())

const SAMPLE: Habit[] = [
  { id: '1', name: 'Morning workout', color: COLORS[1] },
  { id: '2', name: 'Read 30 min',     color: COLORS[0] },
  { id: '3', name: 'Meditate',        color: COLORS[2] },
  { id: '4', name: 'Drink 2L water',  color: COLORS[4] },
  { id: '5', name: 'No social media', color: COLORS[3] },
  { id: '6', name: 'Sleep by 11pm',   color: COLORS[5] },
  { id: '7', name: 'Journal entry',   color: COLORS[6] },
]

const PCT_MARKS = [0, 25, 50, 75, 100]

/* ══════════════════════════════════════════════════════════════ */
export default function Habits() {
  const [habits, setHabits]       = useState<Habit[]>(SAMPLE)
  const [checks, setChecks]       = useState<CheckMap>({})
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [showAdd, setShowAdd]     = useState(false)
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState(COLORS[0])
  const [hoveredPt, setHoveredPt] = useState<number | null>(null)
  const [tipPos, setTipPos]       = useState({ x: 0, y: 0 })
  const [svgSize, setSvgSize]     = useState({ w: 360, h: 200 })
  const graphWrapRef              = useRef<HTMLDivElement>(null)
  const svgRef                    = useRef<SVGSVGElement>(null)

  const monthKey = viewMonth.getFullYear() + '-' + viewMonth.getMonth()

  /* Responsive SVG sizing */
  useLayoutEffect(() => {
    const el = graphWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSvgSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Days in current view month */
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

  /* ── Chart data: one entry per day up to today ── */
  const chartData = useMemo(() => {
    const days = monthDays.filter(d => dk(d) <= TODAY)
    if (!habits.length || !days.length) return []
    return days.map(d => {
      const ds = dk(d)
      const done = habits.filter(h => isChecked(h.id, ds)).length
      return { day: d.getDate(), pct: (done / habits.length) * 100, done, total: habits.length, date: d }
    })
  }, [monthDays, habits, isChecked])

  /* ── Chart SVG geometry (horizontal: X=%, Y=days) ── */
  const chartSvg = useMemo(() => {
    if (chartData.length < 1) return null
    const W = svgSize.w, H = svgSize.h
    const PL = 32, PR = 12, PT = 8, PB = 22
    const chartW = W - PL - PR
    const chartH = H - PT - PB

    const pts: [number, number][] = chartData.map((d, i) => [
      PL + (d.pct / 100) * chartW,
      PT + (i / Math.max(chartData.length - 1, 1)) * chartH,
    ])

    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')

    return { pts, pathD, W, H, PL, PR, PT, PB, chartW, chartH }
  }, [chartData, svgSize])

  /* SVG hover */
  const onSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvg || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let best: number | null = null, bestD = Infinity
    chartSvg.pts.forEach(([px, py], i) => {
      const d = Math.hypot(px - mx, py - my)
      if (d < bestD && d < 24) { bestD = d; best = i }
    })
    setHoveredPt(best)
    if (best !== null) setTipPos({ x: chartSvg.pts[best][0], y: chartSvg.pts[best][1] })
  }, [chartSvg])

  const onSvgLeave = useCallback(() => setHoveredPt(null), [])
  const tip = hoveredPt !== null ? chartData[hoveredPt] : null

  /* ── Stats computations ── */
  const stats = useMemo(() => {
    const todayDone = habits.filter(h => isChecked(h.id, TODAY)).length
    const todayTotal = habits.length
    const pastDays = monthDays.filter(d => dk(d) <= TODAY)

    // Month completion
    let totalChecks = 0, totalPossible = 0
    pastDays.forEach(d => {
      const ds = dk(d)
      habits.forEach(h => {
        totalPossible++
        if (isChecked(h.id, ds)) totalChecks++
      })
    })
    const monthPct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0

    // Current streak (consecutive days with 100%)
    let currentStreak = 0
    const sortedPast = [...pastDays].sort((a, b) => b.getTime() - a.getTime())
    for (const d of sortedPast) {
      const ds = dk(d)
      const allDone = habits.every(h => isChecked(h.id, ds))
      if (allDone && habits.length > 0) currentStreak++
      else break
    }

    // Best streak
    let bestStreak = 0, run = 0
    const sortedAsc = [...pastDays].sort((a, b) => a.getTime() - b.getTime())
    for (const d of sortedAsc) {
      const ds = dk(d)
      const allDone = habits.every(h => isChecked(h.id, ds))
      if (allDone && habits.length > 0) { run++; if (run > bestStreak) bestStreak = run }
      else run = 0
    }

    // Perfect days this month
    let perfectDays = 0
    pastDays.forEach(d => {
      const ds = dk(d)
      if (habits.length > 0 && habits.every(h => isChecked(h.id, ds))) perfectDays++
    })

    return { todayDone, todayTotal, monthPct, currentStreak, bestStreak, perfectDays, daysElapsed: pastDays.length }
  }, [habits, monthDays, isChecked])

  const addHabit = () => {
    if (!newName.trim()) return
    setHabits(prev => [...prev, { id: Date.now().toString(), name: newName.trim(), color: newColor }])
    setNewName(''); setNewColor(COLORS[0]); setShowAdd(false)
  }

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className={styles.wrap}>

      {/* ── Header: month switcher left, add button right ── */}
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>‹</button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button className={styles.navBtn} onClick={nextMonth}>›</button>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ New habit</button>
      </div>

      {/* ── Habit Grid: center, big ── */}
      <div className={styles.gridCard} key={monthKey}>
        {habits.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 28, opacity: 0.2 }}>◎</span>
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
              {habits.map((habit, idx) => (
                <tr key={habit.id} className={`${styles.habitRow} ${idx % 2 === 1 ? styles.habitRowAlt : ''}`}>
                  <td className={styles.nameCell}>
                    <span className={styles.habitDot} style={{ background: habit.color }} />
                    <span className={styles.habitLabel}>{habit.name}</span>
                  </td>
                  {monthDays.map(d => {
                    const ds = dk(d)
                    const state = getCellState(ds)
                    const checked = isChecked(habit.id, ds)
                    const cls = [
                      styles.sq,
                      state === 'today' && checked ? styles.sqCheckedToday :
                      state === 'today'            ? styles.sqToday :
                      checked                      ? styles.sqChecked :
                      state === 'past'             ? styles.sqPast :
                                                     styles.sqFuture,
                    ].filter(Boolean).join(' ')
                    return (
                      <td key={ds} className={`${styles.cell} ${ds === TODAY ? styles.cellToday : ''}`}>
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

      {/* ── Bottom row: graph left, stats right ── */}
      <div className={styles.bottomRow}>

        {/* Completion Graph */}
        <div className={styles.graphCard}>
          <span className={styles.sectionTitle}>Completion rate</span>
          <div className={styles.graphWrap} ref={graphWrapRef}>
            {chartSvg ? (
              <>
                <svg
                  ref={svgRef}
                  className={styles.graphSvg}
                  viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
                  onMouseMove={onSvgMove}
                  onMouseLeave={onSvgLeave}
                >
                  {/* Vertical grid lines at 0, 25, 50, 75, 100 */}
                  {PCT_MARKS.map(pct => {
                    const x = chartSvg.PL + (pct / 100) * chartSvg.chartW
                    return (
                      <g key={pct}>
                        <line
                          x1={x} y1={chartSvg.PT}
                          x2={x} y2={chartSvg.PT + chartSvg.chartH}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="1"
                        />
                        <text x={x} y={svgSize.h - 4} className={styles.xLabel} textAnchor="middle">
                          {pct}
                        </text>
                      </g>
                    )
                  })}

                  {/* Y-axis: day labels */}
                  {chartData.map((d, i) => {
                    const step = Math.max(1, Math.floor(chartData.length / 8))
                    if (i % step !== 0 && i !== chartData.length - 1) return null
                    const y = chartSvg.PT + (i / Math.max(chartData.length - 1, 1)) * chartSvg.chartH
                    return (
                      <text key={i} x={chartSvg.PL - 4} y={y + 3} className={styles.yLabel} textAnchor="end">
                        {d.day}
                      </text>
                    )
                  })}

                  {/* Connecting line */}
                  <path
                    d={chartSvg.pathD}
                    fill="none"
                    stroke="oklch(0.65 0.16 290)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* Data points */}
                  {chartSvg.pts.map(([x, y], i) => (
                    <circle
                      key={i} cx={x} cy={y}
                      r={hoveredPt === i ? 5 : 2.5}
                      fill={hoveredPt === i ? 'oklch(0.82 0.18 290)' : 'oklch(0.72 0.16 290)'}
                      style={{ transition: 'r 0.12s ease' }}
                    />
                  ))}
                </svg>

                {/* Tooltip */}
                {tip && (
                  <div
                    className={styles.chartTip}
                    style={{
                      left: Math.min(Math.max(4, tipPos.x - 68), svgSize.w - 148),
                      top: Math.max(4, tipPos.y - 80),
                    }}
                  >
                    <div className={styles.ctDate}>
                      {DAY_SHORT[tip.date.getDay()]} {MON_SHORT[tip.date.getMonth()]} {tip.day}
                    </div>
                    <div className={styles.ctPct}>{Math.round(tip.pct)}%</div>
                    <div className={styles.ctBar}>
                      <div className={styles.ctFill} style={{ width: Math.round(tip.pct) + '%' }} />
                    </div>
                    <div className={styles.ctDetail}>
                      <span className={styles.ctItem}>
                        <span className={styles.ctDotGreen} />
                        {tip.done} followed
                      </span>
                      <span className={styles.ctItem}>
                        <span className={styles.ctDotRed} />
                        {tip.total - tip.done} missed
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noData}>No data yet</div>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        <div className={styles.statsCard}>
          <span className={styles.sectionTitle}>Stats</span>
          <div className={styles.statsGrid}>
            {/* Today's progress ring */}
            <div className={styles.statBlock}>
              <div className={styles.ringWrap}>
                <svg viewBox="0 0 48 48" className={styles.ringSvg}>
                  <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle
                    cx="24" cy="24" r="19" fill="none"
                    stroke="oklch(0.65 0.14 150)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.todayTotal > 0 ? stats.todayDone / stats.todayTotal : 0) * 119.38} 119.38`}
                    transform="rotate(-90 24 24)"
                  />
                  <text x="24" y="26" textAnchor="middle" className={styles.ringText}>
                    {stats.todayDone}/{stats.todayTotal}
                  </text>
                </svg>
              </div>
              <span className={styles.statLabel}>Today</span>
            </div>

            {/* Month completion */}
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.monthPct}%</span>
              <span className={styles.statLabel}>This month</span>
            </div>

            {/* Current streak */}
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.currentStreak}<span className={styles.statUnit}>d</span></span>
              <span className={styles.statLabel}>Current streak</span>
            </div>

            {/* Best streak */}
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.bestStreak}<span className={styles.statUnit}>d</span></span>
              <span className={styles.statLabel}>Best streak</span>
            </div>

            {/* Perfect days */}
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.perfectDays}</span>
              <span className={styles.statLabel}>Perfect days</span>
            </div>

            {/* Days elapsed */}
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.daysElapsed}</span>
              <span className={styles.statLabel}>Days tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Habit Modal ── */}
      {showAdd && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
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
