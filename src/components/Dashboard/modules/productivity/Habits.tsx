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

export default function Habits() {
  const [habits, setHabits]           = useState<Habit[]>(SAMPLE)
  const [checks, setChecks]           = useState<CheckMap>({})
  const [viewMonth, setViewMonth]     = useState(() => new Date())
  const [showAdd, setShowAdd]         = useState(false)
  const [newName, setNewName]         = useState('')
  const [newColor, setNewColor]       = useState(COLORS[0])
  const [dragIdx, setDragIdx]         = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

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

  const onDragStart = (idx: number) => setDragIdx(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return
    setHabits(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(null); setDragOverIdx(null)
  }
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }

  const chartData = useMemo(() => {
    const days = monthDays.filter(d => dk(d) <= TODAY)
    if (!habits.length || !days.length) return []
    return days.map(d => {
      const ds = dk(d)
      const done = habits.filter(h => isChecked(h.id, ds)).length
      return { day: d.getDate(), pct: done / habits.length }
    })
  }, [monthDays, habits, isChecked])

  const chartSvg = useMemo(() => {
    if (chartData.length < 1) return null
    const W = 400, H = 72, PL = 28, PR = 6, PV = 6
    const pts: [number, number][] = chartData.map((d, i) => [
      PL + (i / Math.max(chartData.length - 1, 1)) * (W - PL - PR),
      PV + (1 - d.pct) * (H - PV * 2),
    ])
    const polyline = pts.map(p => p.join(',')).join(' ')
    const area = 'M' + pts[0][0] + ',' + H + ' ' +
      pts.map(p => 'L' + p[0] + ',' + p[1]).join(' ') +
      ' L' + pts[pts.length - 1][0] + ',' + H + ' Z'
    return { pts, polyline, area, W, H, PL, PV }
  }, [chartData])

  const insight = useMemo(() => {
    if (!habits.length) return null
    const pastDays = monthDays.filter(d => dk(d) <= TODAY)
    if (!pastDays.length) return null
    let best = habits[0], bestCount = 0
    habits.forEach(h => {
      const count = pastDays.filter(d => isChecked(h.id, dk(d))).length
      if (count > bestCount) { bestCount = count; best = h }
    })
    if (bestCount === 0) return null
    const pct = Math.round(bestCount / pastDays.length * 100)
    return { habit: best, count: bestCount, pct, total: pastDays.length }
  }, [habits, monthDays, isChecked])

  const addHabit = () => {
    if (!newName.trim()) return
    setHabits(prev => [...prev, { id: Date.now().toString(), name: newName.trim(), color: newColor }])
    setNewName(''); setNewColor(COLORS[0]); setShowAdd(false)
  }

  return (
    <div className={styles.wrap}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>‹</button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button className={styles.navBtn} onClick={nextMonth}>›</button>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.title}>Habits</span>
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add habit</button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Monthly grid card */}
        <div className={styles.gridCard}>
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
                      <th key={ds} className={styles.thDay + (ds === TODAY ? ' ' + styles.thToday : '')}>
                        <span className={styles.dayNum}>{d.getDate()}</span>
                        <span className={styles.dayName}>{DAY_NAMES[d.getDay()]}</span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, idx) => (
                  <tr
                    key={habit.id}
                    className={[
                      styles.habitRow,
                      dragIdx === idx ? styles.dragging : '',
                      dragOverIdx === idx ? styles.dragOver : '',
                    ].join(' ')}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={e => onDragOver(e, idx)}
                    onDrop={() => onDrop(idx)}
                    onDragEnd={onDragEnd}
                  >
                    <td className={styles.nameCell}>
                      <div className={styles.nameCellInner}>
                        <span className={styles.dragHandle}>⠿</span>
                        <span className={styles.habitLabel} style={{ color: habit.color }}>
                          {habit.name}
                        </span>
                      </div>
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

        {/* ── Bottom row ── */}
        <div className={styles.bottomRow}>

          {/* Line chart */}
          <div className={styles.chartCard}>
            <span className={styles.chartLabel}>
              Completion · {MONTH_NAMES[viewMonth.getMonth()]}
            </span>
            {chartSvg ? (
              <svg
                className={styles.graphSvg}
                viewBox={'0 0 ' + chartSvg.W + ' ' + chartSvg.H}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="habGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.18 290)" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="oklch(0.55 0.18 290)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {([{ v: 1, label: '100%' }, { v: 0.5, label: '50%' }, { v: 0, label: '0%' }] as const).map(({ v, label }) => {
                  const y = chartSvg.PV + (1 - v) * (chartSvg.H - chartSvg.PV * 2)
                  return (
                    <g key={v}>
                      <line x1={chartSvg.PL} y1={y} x2={chartSvg.W - 6} y2={y}
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      <text x={chartSvg.PL - 4} y={y + 3} className={styles.yLabel} textAnchor="end">
                        {label}
                      </text>
                    </g>
                  )
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
          <div className={styles.insightCard}>
            <span className={styles.insightBadge}>INSIGHT</span>
            {insight ? (
              <>
                <div className={styles.insightHabitRow}>
                  <span className={styles.insightDot} style={{ background: insight.habit.color }} />
                  <span className={styles.insightHabitName}>{insight.habit.name}</span>
                </div>
                <span className={styles.insightSub}>
                  Most consistent · {insight.count}/{insight.total} days · {insight.pct}% this month
                </span>
              </>
            ) : (
              <span className={styles.insightSub}>
                Start checking off habits to see your most consistent one here
              </span>
            )}
          </div>

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
                    className={styles.colorDot + (newColor === c ? ' ' + styles.colorDotActive : '')}
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
