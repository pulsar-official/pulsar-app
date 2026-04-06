'use client'

import React, { useMemo, useRef, useLayoutEffect, useState } from 'react'
import styles from './HabitChartWidget.module.scss'
import { useProductivityStore } from '@/stores/productivityStore'
import type { Habit, HabitCheck } from '@/types/productivity'

function dk(d: Date) {
  return d.toISOString().slice(0, 10)
}

const TODAY = dk(new Date())

interface HabitChartWidgetProps {
  // Optional props for testing/override. If not provided, data comes from store.
  habits?: Habit[]
  habitChecks?: HabitCheck[]
  days?: number // 7 or 14 days. Default: 7
}

export const HabitChartWidget: React.FC<HabitChartWidgetProps> = ({
  habits: propHabits,
  habitChecks: propHabitChecks,
  days = 7,
}) => {
  const storeHabits = useProductivityStore(s => s.habits)
  const storeHabitChecks = useProductivityStore(s => s.habitChecks)

  // Use provided props or fall back to store
  const habits = propHabits ?? storeHabits
  const habitChecks = propHabitChecks ?? storeHabitChecks

  // Build check map
  const checkMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const check of habitChecks) {
      const hid = check.habitId
      if (!map[hid]) map[hid] = {}
      map[hid][check.date] = check.checked
    }
    return map
  }, [habitChecks])

  const isChecked = (habitId: string, dateStr: string) => checkMap[habitId]?.[dateStr] ?? false

  // Generate date range (last N days inclusive of today)
  const dateRange = useMemo(() => {
    const arr: Date[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      arr.push(d)
    }
    return arr
  }, [days])

  // Build chart data
  const chartData = useMemo(() => {
    if (habits.length === 0 || dateRange.length === 0) return []

    return dateRange.map(d => {
      const ds = dk(d)
      const done = habits.filter(h => isChecked(h.id, ds)).length
      const pct = (done / habits.length) * 100
      return { date: d, dateStr: ds, pct, done, total: habits.length }
    })
  }, [dateRange, habits, isChecked])

  // SVG sizing
  const graphWrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 300, h: 180 })

  useLayoutEffect(() => {
    const el = graphWrapRef.current
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

  // Build SVG geometry
  const chartSvg = useMemo(() => {
    if (chartData.length < 1) return null

    const W = svgSize.w
    const H = svgSize.h
    const PL = 24  // padding-left
    const PR = 8   // padding-right
    const PT = 8   // padding-top
    const PB = 18  // padding-bottom
    const chartW = W - PL - PR
    const chartH = H - PT - PB

    // Points: X = day index, Y = percentage (0-100)
    const pts: [number, number][] = chartData.map((d, i) => [
      PL + (i / Math.max(chartData.length - 1, 1)) * chartW,
      PT + (1 - d.pct / 100) * chartH,
    ])

    // Line path
    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')

    // Area path (filled region)
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

    return { pts, pathD, areaD, W, H, PL, PR, PT, PB, chartW, chartH }
  }, [chartData, svgSize])

  if (!chartSvg || chartData.length === 0) {
    return (
      <div className={styles.widget}>
        <div className={styles.empty}>No data yet</div>
      </div>
    )
  }

  return (
    <div className={styles.widget}>
      <div className={styles.chartWrapper} ref={graphWrapRef}>
        <svg
          ref={svgRef}
          width={chartSvg.W}
          height={chartSvg.H}
          className={styles.svg}
          viewBox={`0 0 ${chartSvg.W} ${chartSvg.H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines (optional) */}
          <line
            x1={chartSvg.PL}
            y1={chartSvg.PT + chartSvg.chartH * 0.5}
            x2={chartSvg.W - chartSvg.PR}
            y2={chartSvg.PT + chartSvg.chartH * 0.5}
            className={styles.gridLine}
          />

          {/* Y-axis label at 50% */}
          <text x={6} y={chartSvg.PT + chartSvg.chartH * 0.5 + 3} className={styles.yLabel}>
            50%
          </text>

          {/* Area fill */}
          <path d={chartSvg.areaD} className={styles.area} />

          {/* Line */}
          <path d={chartSvg.pathD} className={styles.line} />

          {/* Data points */}
          {chartSvg.pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={2.5} className={styles.dot} />
          ))}

          {/* X-axis labels (dates) */}
          {chartData.map((d, i) => {
            const x = chartSvg.PL + (i / Math.max(chartData.length - 1, 1)) * chartSvg.chartW
            const label = d.dateStr === TODAY ? 'Today' : d.date.getDate().toString()
            return (
              <text key={i} x={x} y={chartSvg.H - 2} className={styles.xLabel}>
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default HabitChartWidget
