"use client"

import React, { useState, useMemo, useCallback, useRef, useLayoutEffect } from "react"
import styles from "./MoodTracker.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import { MOODS, MOOD_COLORS, MOOD_LABELS, MOOD_VALUES, TAGS } from '@/constants/journal'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dk(d: Date) { return d.toISOString().slice(0, 10) }

const MoodTracker: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const entries = useProductivityStore(s => s.journalEntries)
  const moodDist = useProductivityStore(s => s.getJournalMoodDistribution)()

  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [hoveredPt, setHoveredPt] = useState<number | null>(null)
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 })
  const [svgSize, setSvgSize] = useState({ w: 400, h: 200 })
  const graphWrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const prevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

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

  // Chart data: entries grouped by day for the view month
  const chartData = useMemo(() => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    const todayStr = dk(new Date())
    const lastDay = new Date(y, m + 1, 0).getDate()
    const data: { day: number; mood: string; value: number; title: string; date: Date }[] = []

    for (let d = 1; d <= lastDay; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (ds > todayStr) break
      const dayEntries = entries.filter(e => e.date === ds)
      if (dayEntries.length === 0) continue
      const avgValue = dayEntries.reduce((sum, e) => sum + (MOOD_VALUES[e.mood] ?? 3), 0) / dayEntries.length
      const primaryMood = dayEntries[0].mood
      data.push({ day: d, mood: primaryMood, value: avgValue, title: dayEntries[0].title, date: new Date(y, m, d) })
    }
    return data
  }, [entries, viewMonth])

  // SVG geometry
  const chartSvg = useMemo(() => {
    if (chartData.length < 1) return null
    const W = svgSize.w, H = svgSize.h
    const PL = 28, PR = 12, PT = 12, PB = 22
    const chartW = W - PL - PR, chartH = H - PT - PB

    const pts: [number, number][] = chartData.map((d, i) => [
      PL + (i / Math.max(chartData.length - 1, 1)) * chartW,
      PT + (1 - d.value / 5) * chartH,
    ])

    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')
    const areaD = 'M' + pts[0][0] + ',' + (PT + chartH) + ' ' +
      pts.map(p => 'L' + p[0] + ',' + p[1]).join(' ') +
      ' L' + pts[pts.length - 1][0] + ',' + (PT + chartH) + ' Z'

    return { pts, pathD, areaD, W, H, PL, PR, PT, PB, chartW, chartH }
  }, [chartData, svgSize])

  const onSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvg || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
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

  // Mood distribution: total count
  const totalEntries = entries.length
  const maxDist = Math.max(...Object.values(moodDist), 1)

  // Mood-tag correlation
  const correlation = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    for (const mood of MOODS) {
      map[mood] = {}
      for (const tag of TAGS) map[mood][tag] = 0
    }
    for (const e of entries) {
      for (const tag of e.tags) {
        if (map[e.mood] && map[e.mood][tag] !== undefined) map[e.mood][tag]++
      }
    }
    return map
  }, [entries])

  const maxCorrelation = useMemo(() => {
    let max = 1
    for (const mood of MOODS) for (const tag of TAGS) {
      if (correlation[mood][tag] > max) max = correlation[mood][tag]
    }
    return max
  }, [correlation])

  const yMarks = [0, 1, 2, 3, 4, 5]
  const moodAtValue: Record<number, string> = { 5: '🤩', 4: '😊', 3: '😐', 2: '😴', 1: '😔', 0: '😡' }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.pageTitle}>Mood Tracker</div>
        {onNavigate && (
          <button className={styles.backBtn} onClick={() => onNavigate('journal')}>Back to Journal</button>
        )}
      </div>

      {/* Mood over time chart */}
      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <span className={styles.sectionTitle}>Mood over time</span>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={prevMonth}>&#8249;</button>
            <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
            <button className={styles.navBtn} onClick={nextMonth}>&#8250;</button>
          </div>
        </div>
        <div className={styles.graphWrap} ref={graphWrapRef}>
          {chartSvg ? (
            <>
              <svg ref={svgRef} className={styles.graphSvg} viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} onMouseMove={onSvgMove} onMouseLeave={onSvgLeave}>
                <defs>
                  <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.16 60)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="oklch(0.55 0.16 60)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {yMarks.map(v => {
                  const y = chartSvg.PT + (1 - v / 5) * chartSvg.chartH
                  return (
                    <g key={v}>
                      <line x1={chartSvg.PL} y1={y} x2={chartSvg.W - chartSvg.PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <text x={chartSvg.PL - 4} y={y + 4} className={styles.yLabel} textAnchor="end">{moodAtValue[v]}</text>
                    </g>
                  )
                })}
                {chartData.map((d, i) => {
                  const step = Math.max(1, Math.floor(chartData.length / 8))
                  if (i % step !== 0 && i !== chartData.length - 1) return null
                  const x = chartSvg.PL + (i / Math.max(chartData.length - 1, 1)) * chartSvg.chartW
                  return <text key={i} x={x} y={svgSize.h - 4} className={styles.xLabel} textAnchor="middle">{d.day}</text>
                })}
                <path d={chartSvg.areaD} fill="url(#moodAreaGrad)" />
                <path d={chartSvg.pathD} fill="none" stroke="oklch(0.65 0.16 60)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                {chartSvg.pts.map(([x, y], i) => (
                  <text key={i} x={x} y={y + 5} textAnchor="middle" fontSize={hoveredPt === i ? 16 : 12} style={{ transition: 'font-size 0.12s ease' }}>
                    {chartData[i].mood}
                  </text>
                ))}
              </svg>
              {tip && (
                <div className={styles.chartTip} style={{ left: Math.min(Math.max(4, tipPos.x - 68), svgSize.w - 148), top: Math.max(4, tipPos.y - 72) }}>
                  <div className={styles.ctDate}>{MON_SHORT[tip.date.getMonth()]} {tip.day}</div>
                  <div className={styles.ctMood}>{tip.mood} {MOOD_LABELS[tip.mood]}</div>
                  <div className={styles.ctTitle}>{tip.title}</div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noData}>No mood data for this month</div>
          )}
        </div>
      </div>

      <div className={styles.bottomRow}>
        {/* Mood distribution */}
        <div className={styles.distCard}>
          <span className={styles.sectionTitle}>Distribution</span>
          <div className={styles.distBars}>
            {MOODS.map(mood => {
              const count = moodDist[mood] || 0
              const pct = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0
              return (
                <div key={mood} className={styles.distRow}>
                  <span className={styles.distEmoji}>{mood}</span>
                  <div className={styles.distBarWrap}>
                    <div className={styles.distBar} style={{ width: `${(count / maxDist) * 100}%`, background: MOOD_COLORS[mood] }} />
                  </div>
                  <span className={styles.distCount}>{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mood-tag correlation */}
        <div className={styles.corrCard}>
          <span className={styles.sectionTitle}>Mood × Tag</span>
          <div className={styles.corrTable}>
            <div className={styles.corrHeader}>
              <div className={styles.corrCorner} />
              {TAGS.map(t => <div key={t} className={styles.corrTag}>#{t}</div>)}
            </div>
            {MOODS.map(mood => (
              <div key={mood} className={styles.corrRow}>
                <div className={styles.corrMood}>{mood}</div>
                {TAGS.map(tag => {
                  const val = correlation[mood][tag]
                  const opacity = val > 0 ? 0.2 + (val / maxCorrelation) * 0.8 : 0
                  return (
                    <div key={tag} className={styles.corrCell} style={{ background: `oklch(0.55 0.14 60 / ${opacity})` }}>
                      {val > 0 ? val : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoodTracker
