"use client"

import React, { useState, useMemo, useRef, useLayoutEffect, useCallback } from "react"
import styles from "./JournalStreaks.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import { MOOD_COLORS } from '@/constants/journal'

const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function dk(d: Date) { return d.toISOString().slice(0, 10) }

const JournalStreaks: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const entries = useProductivityStore(s => s.journalEntries)
  const streak = useProductivityStore(s => s.getJournalStreak)()

  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null)
  const [svgSize, setSvgSize] = useState({ w: 600, h: 120 })
  const heatmapRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = heatmapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSvgSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Entries per date
  const entryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) map[e.date] = (map[e.date] || 0) + 1
    return map
  }, [entries])

  // Moods per date (first entry mood)
  const dateMoods = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entries) if (!map[e.date]) map[e.date] = e.mood
    return map
  }, [entries])

  // This month stats
  const thisMonthStats = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    const daysElapsed = now.getDate()
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}`
    let daysWithEntries = 0
    for (const date of streak.dates) {
      if (date.startsWith(prefix)) daysWithEntries++
    }
    return { daysWithEntries, daysElapsed }
  }, [streak.dates])

  // Heatmap: last 12 weeks (84 days)
  const heatmapData = useMemo(() => {
    const weeks: { date: string; count: number; day: number }[][] = []
    const todayDate = new Date()
    const startDate = new Date(todayDate)
    startDate.setDate(startDate.getDate() - 83)
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    let current = new Date(startDate)
    let week: { date: string; count: number; day: number }[] = []
    while (current <= todayDate || week.length > 0) {
      const ds = dk(current)
      week.push({ date: ds, count: entryCounts[ds] || 0, day: current.getDay() })
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
      current.setDate(current.getDate() + 1)
      if (current > todayDate && week.length === 0) break
    }
    if (week.length > 0) weeks.push(week)
    return weeks
  }, [entryCounts])

  // Weekly bar chart: last 8 weeks
  const weeklyBars = useMemo(() => {
    const bars: { label: string; days: number }[] = []
    const todayDate = new Date()
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(todayDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7)
      let days = 0
      for (let d = 0; d < 7; d++) {
        const dd = new Date(weekStart)
        dd.setDate(dd.getDate() + d)
        if (dd > todayDate) break
        if (entryCounts[dk(dd)]) days++
      }
      bars.push({ label: `${MON_SHORT[weekStart.getMonth()]} ${weekStart.getDate()}`, days })
    }
    return bars
  }, [entryCounts])

  // Heatmap SVG
  const cellSize = 12, cellGap = 2
  const heatmapW = heatmapData.length * (cellSize + cellGap) + 30
  const heatmapH = 7 * (cellSize + cellGap) + 20

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.04)'
    if (count === 1) return 'oklch(0.35 0.12 60)'
    if (count === 2) return 'oklch(0.50 0.14 60)'
    return 'oklch(0.65 0.16 60)'
  }

  const onCellHover = useCallback((date: string, count: number, x: number, y: number) => {
    setHoveredCell({ date, count, x, y })
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.pageTitle}>Journal Streaks</div>
        {onNavigate && (
          <button className={styles.backBtn} onClick={() => onNavigate('journal')}>Back to Journal</button>
        )}
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{streak.current}<span className={styles.statUnit}>d</span></span>
          <span className={styles.statLabel}>Current streak</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{streak.longest}<span className={styles.statUnit}>d</span></span>
          <span className={styles.statLabel}>Longest streak</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{entries.length}</span>
          <span className={styles.statLabel}>Total entries</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{thisMonthStats.daysWithEntries}<span className={styles.statUnit}>/{thisMonthStats.daysElapsed}</span></span>
          <span className={styles.statLabel}>This month</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className={styles.heatmapCard}>
        <span className={styles.sectionTitle}>Activity</span>
        <div className={styles.heatmapWrap} ref={heatmapRef}>
          <svg viewBox={`0 0 ${heatmapW} ${heatmapH}`} className={styles.heatmapSvg}>
            {/* Day labels */}
            {DAY_LABELS.map((label, i) => label && (
              <text key={i} x={0} y={18 + i * (cellSize + cellGap) + cellSize / 2} className={styles.dayLabel} dominantBaseline="central">
                {label}
              </text>
            ))}
            {/* Cells */}
            {heatmapData.map((week, wi) => week.map((cell, di) => (
              <rect
                key={`${wi}-${di}`}
                x={30 + wi * (cellSize + cellGap)}
                y={18 + di * (cellSize + cellGap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={getColor(cell.count)}
                onMouseEnter={() => onCellHover(cell.date, cell.count, 30 + wi * (cellSize + cellGap), 18 + di * (cellSize + cellGap))}
                onMouseLeave={() => setHoveredCell(null)}
                style={{ cursor: 'default' }}
              />
            )))}
            {/* Month labels on top */}
            {heatmapData.map((week, wi) => {
              if (wi === 0) return null
              const d = new Date(week[0].date)
              const prevD = new Date(heatmapData[wi - 1][0].date)
              if (d.getMonth() !== prevD.getMonth()) {
                return <text key={`m${wi}`} x={30 + wi * (cellSize + cellGap)} y={12} className={styles.monthLabel2}>{MON_SHORT[d.getMonth()]}</text>
              }
              return null
            })}
          </svg>
          {hoveredCell && (
            <div className={styles.heatTip} style={{ left: hoveredCell.x + cellSize + 8, top: hoveredCell.y - 8 }}>
              <div className={styles.htDate}>{hoveredCell.date}</div>
              <div className={styles.htCount}>{hoveredCell.count} {hoveredCell.count === 1 ? 'entry' : 'entries'}</div>
              {dateMoods[hoveredCell.date] && <div className={styles.htMood}>{dateMoods[hoveredCell.date]}</div>}
            </div>
          )}
        </div>
        <div className={styles.legend}>
          <span className={styles.legendLabel}>Less</span>
          {[0, 1, 2, 3].map(n => <span key={n} className={styles.legendCell} style={{ background: getColor(n) }} />)}
          <span className={styles.legendLabel}>More</span>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className={styles.weeklyCard}>
        <span className={styles.sectionTitle}>Weekly activity</span>
        <div className={styles.weeklyBars}>
          {weeklyBars.map((bar, i) => (
            <div key={i} className={styles.barCol}>
              <div className={styles.barWrap}>
                <div className={styles.bar} style={{ height: `${(bar.days / 7) * 100}%` }} />
              </div>
              <span className={styles.barLabel}>{bar.label}</span>
              <span className={styles.barValue}>{bar.days}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default JournalStreaks
