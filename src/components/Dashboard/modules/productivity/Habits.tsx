'use client'
import { useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react'
import styles from './Habits.module.scss'
import { useProductivityStore } from '@/stores/productivityStore'
import RelatedItems from '../shared/RelatedItems'
import DeleteConfirmModal from '../shared/DeleteConfirmModal'
import PrivacyToggle from '../shared/PrivacyToggle'

/* ── Emoji palette for habit picker ── */
const EMOJI_OPTIONS = [
  '🏋️','📖','🧘','💧','📵','😴','✍️','🎵','💻','🏃',
  '🍳','💊','🧹','📝','🎯','🌿','🚿','🐕','💰','🧠',
  '🎨','📸','🗣️','❤️','☕','🚭','📚','🎸','🧪','🙏',
]

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dk(d: Date) { return d.toISOString().slice(0, 10) }
const TODAY = dk(new Date())

const PCT_MARKS = [0, 25, 50, 75, 100]

/* ══════════════════════════════════════════════════════════════ */
export default function Habits({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const habits = useProductivityStore(s => s.habits)
  const habitChecks = useProductivityStore(s => s.habitChecks)
  const checkMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const check of habitChecks) {
      const hid = check.habitId
      if (!map[hid]) map[hid] = {}
      map[hid][check.date] = check.checked
    }
    return map
  }, [habitChecks])
  const storeAddHabit = useProductivityStore(s => s.addHabit)
  const storeToggleCheck = useProductivityStore(s => s.toggleHabitCheck)
  const storeDeleteHabit = useProductivityStore(s => s.deleteHabit)
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [showAdd, setShowAdd]     = useState(false)
  const [newName, setNewName]     = useState('')
  const [newEmoji, setNewEmoji]   = useState(EMOJI_OPTIONS[0])
  const [newIsPublic, setNewIsPublic] = useState(false)
  const [confirmDeleteHabitId, setConfirmDeleteHabitId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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
    checkMap[habitId]?.[dateStr] ?? false, [checkMap])

  const toggle = useCallback((habitId: string) => {
    storeToggleCheck(habitId, TODAY)
  }, [storeToggleCheck])

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

  /* ── Chart SVG geometry: X=days, Y=percentage (0-100) ── */
  const chartSvg = useMemo(() => {
    if (chartData.length < 1) return null
    const W = svgSize.w, H = svgSize.h
    const PL = 28, PR = 12, PT = 8, PB = 22
    const chartW = W - PL - PR
    const chartH = H - PT - PB

    const pts: [number, number][] = chartData.map((d, i) => [
      PL + (i / Math.max(chartData.length - 1, 1)) * chartW,
      PT + (1 - d.pct / 100) * chartH,
    ])

    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')
    const areaD = 'M' + pts[0][0] + ',' + (PT + chartH) + ' ' +
      pts.map(p => 'L' + p[0] + ',' + p[1]).join(' ') +
      ' L' + pts[pts.length - 1][0] + ',' + (PT + chartH) + ' Z'

    return { pts, pathD, areaD, W, H, PL, PR, PT, PB, chartW, chartH }
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

    let totalChecks = 0, totalPossible = 0
    pastDays.forEach(d => {
      const ds = dk(d)
      habits.forEach(h => { totalPossible++; if (isChecked(h.id, ds)) totalChecks++ })
    })
    const monthPct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0

    let currentStreak = 0
    const sortedPast = [...pastDays].sort((a, b) => b.getTime() - a.getTime())
    for (const d of sortedPast) {
      if (habits.length > 0 && habits.every(h => isChecked(h.id, dk(d)))) currentStreak++
      else break
    }

    let bestStreak = 0, run = 0
    const sortedAsc = [...pastDays].sort((a, b) => a.getTime() - b.getTime())
    for (const d of sortedAsc) {
      if (habits.length > 0 && habits.every(h => isChecked(h.id, dk(d)))) { run++; if (run > bestStreak) bestStreak = run }
      else run = 0
    }

    let perfectDays = 0
    pastDays.forEach(d => {
      if (habits.length > 0 && habits.every(h => isChecked(h.id, dk(d)))) perfectDays++
    })

    return { todayDone, todayTotal, monthPct, currentStreak, bestStreak, perfectDays, daysElapsed: pastDays.length }
  }, [habits, monthDays, isChecked])

  const addHabit = () => {
    if (!newName.trim()) return
    storeAddHabit({ name: newName.trim(), emoji: newEmoji, isPublic: newIsPublic })
    setNewName(''); setNewEmoji(EMOJI_OPTIONS[0]); setNewIsPublic(false); setShowAdd(false)
  }

  const deleteHabit = async (id: string) => {
    setIsDeleting(true)
    await storeDeleteHabit(id)
    setIsDeleting(false)
    setConfirmDeleteHabitId(null)
  }

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className={styles.wrap}>

      {/* ── Header: month switcher left, add button right ── */}
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>&#8249;</button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button className={styles.navBtn} onClick={nextMonth}>&#8250;</button>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ New habit</button>
      </div>

      {/* ── Habit Grid: center, big ── */}
      <div className={styles.gridCard} key={monthKey}>
        {habits.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 28, opacity: 0.2 }}>&#9678;</span>
            <span>No habits yet &mdash; add your first one above</span>
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
                    <span className={styles.habitEmoji}>{habit.emoji}</span>
                    <span className={styles.habitLabel}>{habit.name}</span>
                    <button
                      className={styles.deleteHabitBtn}
                      onClick={() => setConfirmDeleteHabitId(habit.id)}
                      title="Delete habit"
                    >
                      ✕
                    </button>
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
                          {checked && <span className={styles.checkMark}>&#10003;</span>}
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

        {/* Completion Graph — X=days, Y=percentage */}
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
                  <defs>
                    <linearGradient id="habAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.18 290)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="oklch(0.55 0.18 290)" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines at 0, 25, 50, 75, 100% */}
                  {PCT_MARKS.map(pct => {
                    const y = chartSvg.PT + (1 - pct / 100) * chartSvg.chartH
                    return (
                      <g key={pct}>
                        <line
                          x1={chartSvg.PL} y1={y}
                          x2={chartSvg.W - chartSvg.PR} y2={y}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="1"
                        />
                        <text x={chartSvg.PL - 4} y={y + 3} className={styles.yLabel} textAnchor="end">
                          {pct}
                        </text>
                      </g>
                    )
                  })}

                  {/* X-axis: day labels */}
                  {chartData.map((d, i) => {
                    const step = Math.max(1, Math.floor(chartData.length / 8))
                    if (i % step !== 0 && i !== chartData.length - 1) return null
                    const x = chartSvg.PL + (i / Math.max(chartData.length - 1, 1)) * chartSvg.chartW
                    return (
                      <text key={i} x={x} y={svgSize.h - 4} className={styles.xLabel} textAnchor="middle">
                        {d.day}
                      </text>
                    )
                  })}

                  {/* Area fill */}
                  <path d={chartSvg.areaD} fill="url(#habAreaGrad)" />

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
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.monthPct}%</span>
              <span className={styles.statLabel}>This month</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.currentStreak}<span className={styles.statUnit}>d</span></span>
              <span className={styles.statLabel}>Current streak</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.bestStreak}<span className={styles.statUnit}>d</span></span>
              <span className={styles.statLabel}>Best streak</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.perfectDays}</span>
              <span className={styles.statLabel}>Perfect days</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statValue}>{stats.daysElapsed}</span>
              <span className={styles.statLabel}>Days tracked</span>
            </div>
          </div>
        </div>

        {/* Smart connections for habits */}
        {habits.length > 0 && (
          <div className={styles.connectionsCard}>
            <span className={styles.sectionTitle}>Connections</span>
            {habits.slice(0, 3).map(h => (
              <RelatedItems key={h.id} itemType="habit" itemId={h.id} onNavigate={onNavigate} maxItems={2} />
            ))}
          </div>
        )}
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
              <label className={styles.label}>Icon</label>
              <div className={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(em => (
                  <span
                    key={em}
                    className={`${styles.emojiOption} ${newEmoji === em ? styles.emojiOptionActive : ''}`}
                    onClick={() => setNewEmoji(em)}
                  >
                    {em}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <PrivacyToggle isPublic={newIsPublic} onChange={setNewIsPublic} />
              <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={addHabit}>Add habit</button>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={!!confirmDeleteHabitId}
        title="Delete Habit?"
        description={`Are you sure you want to delete this habit? All habit check history will be lost.`}
        itemName={habits.find(h => h.id === confirmDeleteHabitId)?.name || 'this habit'}
        onConfirm={async () => {
          if (confirmDeleteHabitId) {
            await deleteHabit(confirmDeleteHabitId)
          }
        }}
        onCancel={() => setConfirmDeleteHabitId(null)}
        isLoading={isDeleting}
      />
    </div>
  )
}
