'use client'

import { useMemo, useRef, useLayoutEffect, useState, useCallback } from 'react'
import styles from './HabitProgressChart.module.scss'
import type { Habit, HabitCheck } from '@/types/productivity'

interface HabitProgressChartProps {
  habitChecks: HabitCheck[]
  habits: Habit[]
  startDate: string
}

const PCT_MARKS = [0, 25, 50, 75, 100]

export default function HabitProgressChart({
  habitChecks,
  habits,
  startDate,
}: HabitProgressChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 360, h: 200 })

  /* Build check map for O(1) lookups */
  const checkMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const check of habitChecks) {
      const hid = check.habitId
      if (!map[hid]) map[hid] = {}
      map[hid][check.date] = check.checked
    }
    return map
  }, [habitChecks])

  const isChecked = useCallback(
    (habitId: string, dateStr: string) => checkMap[habitId]?.[dateStr] ?? false,
    [checkMap]
  )

  /* Generate last 30 days starting from startDate */
  const days = useMemo(() => {
    const result: { date: string; day: number }[] = []
    const start = new Date(startDate + 'T00:00:00')
    for (let i = 29; i >= 0; i--) {
      const d = new Date(start)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      result.push({
        date: dateStr,
        day: d.getDate(),
      })
    }
    return result
  }, [startDate])

  /* Calculate completion % for each day */
  const chartData = useMemo(() => {
    if (habits.length === 0) return []
    return days.map(d => {
      const completed = habits.filter(h => isChecked(h.id, d.date)).length
      const pct = (completed / habits.length) * 100
      return { date: d.date, day: d.day, pct, completed, total: habits.length }
    })
  }, [days, habits, isChecked])

  /* Responsive SVG sizing */
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        setSvgSize({ w: Math.round(width), h: Math.round(height) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* SVG geometry: compute path and grid lines */
  const svgGeometry = useMemo(() => {
    if (chartData.length < 1) return null

    const W = svgSize.w
    const H = svgSize.h
    const PL = 28 // Left padding (for Y-axis labels)
    const PR = 12 // Right padding
    const PT = 8 // Top padding
    const PB = 24 // Bottom padding

    const chartW = W - PL - PR
    const chartH = H - PT - PB

    /* Points for line path */
    const pts: [number, number][] = chartData.map((d, i) => [
      PL + (i / Math.max(chartData.length - 1, 1)) * chartW,
      PT + (1 - d.pct / 100) * chartH,
    ])

    /* Line path */
    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')

    /* Area under curve */
    const areaD =
      'M' +
      pts[0][0] +
      ',' +
      (PT + chartH) +
      ' ' +
      pts.map(p => 'L' + p[0] + ',' + p[1]).join(' ') +
      ' L' +
      pts[pts.length - 1][0] +
      ',' +
      (PT + chartH) +
      ' Z'

    return {
      pts,
      pathD,
      areaD,
      W,
      H,
      PL,
      PR,
      PT,
      PB,
      chartW,
      chartH,
    }
  }, [chartData, svgSize])

  if (habits.length === 0 || chartData.length === 0) {
    return (
      <div className={styles.empty}>
        <span>Add habits to see progress</span>
      </div>
    )
  }

  if (!svgGeometry) {
    return <div className={styles.container} ref={containerRef} />
  }

  const { W, H, PL, PR, PT, PB, chartW, chartH, pts, pathD, areaD } = svgGeometry

  return (
    <div className={styles.container} ref={containerRef}>
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Y-axis grid lines and labels (0, 25, 50, 75, 100) */}
        {PCT_MARKS.map(pct => {
          const y = PT + (1 - pct / 100) * chartH
          return (
            <g key={`pct-${pct}`}>
              <line
                x1={PL}
                y1={y}
                x2={W - PR}
                y2={y}
                className={styles.gridLine}
                strokeDasharray={pct === 0 || pct === 100 ? 'none' : '2,3'}
              />
              <text x={PL - 8} y={y} className={styles.yLabel}>
                {pct}%
              </text>
            </g>
          )
        })}

        {/* X-axis */}
        <line
          x1={PL}
          y1={PT + chartH}
          x2={W - PR}
          y2={PT + chartH}
          className={styles.axisLine}
        />

        {/* Y-axis */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + chartH} className={styles.axisLine} />

        {/* Area under curve */}
        <path d={areaD} className={styles.area} />

        {/* Line path */}
        <path d={pathD} className={styles.line} />

        {/* Data points */}
        {pts.map((pt, i) => (
          <circle key={`pt-${i}`} cx={pt[0]} cy={pt[1]} r={2.5} className={styles.point} />
        ))}

        {/* X-axis labels (day numbers) */}
        {chartData.map((d, i) => {
          const x = PL + (i / Math.max(chartData.length - 1, 1)) * chartW
          /* Show every 5th day label to avoid crowding */
          const showLabel = i % 5 === 0 || i === chartData.length - 1
          return showLabel ? (
            <text key={`day-${i}`} x={x} y={H - 4} className={styles.xLabel}>
              {d.day}
            </text>
          ) : null
        })}
      </svg>

      {/* Legend / Summary */}
      <div className={styles.summary}>
        <span className={styles.summaryLabel}>Last 30 days</span>
        <span className={styles.summaryValue}>
          {chartData.length > 0
            ? Math.round(chartData.reduce((sum, d) => sum + d.pct, 0) / chartData.length)
            : 0}
          % avg
        </span>
      </div>
    </div>
  )
}
