"use client"

import React, { useRef, useState, useMemo } from "react"
import styles from "./TaskGanttView.module.scss"
import { useProductivityStore } from "@/stores/productivityStore"
import type { Task, TaskStatus } from "@/types/productivity"
import { getTaskBarPosition, groupTasksBySwimlane, getDependencyPath } from "@/utils/ganttUtils"

const TOTAL_WIDTH = 1400
const ROW_HEIGHT = 40
const LABEL_WIDTH = 180

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "oklch(0.55 0.14 240)",
  inprogress: "oklch(0.72 0.16 60)",
  done: "oklch(0.60 0.14 150)",
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const TaskGanttView: React.FC = () => {
  const tasks = useProductivityStore(s => s.tasks)
  const activeTasks = tasks.filter(t => !t.isDeleted)

  const [weekOffset, setWeekOffset] = useState(0)
  const [tooltip, setTooltip] = useState<{ task: Task; x: number; y: number } | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 4-week window centered on today + offset
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const timelineStart = useMemo(() => addDays(today, weekOffset * 7 - 14), [today, weekOffset])
  const timelineEnd = useMemo(() => addDays(timelineStart, 28), [timelineStart])

  const groups = useMemo(() => groupTasksBySwimlane(activeTasks), [activeTasks])

  // Flatten into ordered rows with group labels
  type RowEntry = { type: "group"; label: string } | { type: "task"; task: Task; rowIndex: number }
  const rows: RowEntry[] = []
  let rowIndex = 0
  for (const [lane, laneTasks] of Object.entries(groups)) {
    rows.push({ type: "group", label: lane })
    for (const t of laneTasks) {
      rows.push({ type: "task", task: t, rowIndex })
      rowIndex++
    }
  }

  // Days header
  const dayCount = 28
  const days: Date[] = []
  for (let i = 0; i < dayCount; i++) days.push(addDays(timelineStart, i))

  const todayLeft = ((today.getTime() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * TOTAL_WIDTH

  // Bar positions keyed by task id
  const barPositions = useMemo(() => {
    const map: Record<string, { left: number; width: number }> = {}
    for (const t of activeTasks) {
      map[t.id] = getTaskBarPosition(t as any, timelineStart, timelineEnd, TOTAL_WIDTH)
    }
    return map
  }, [activeTasks, timelineStart, timelineEnd])

  let taskRowCounter = -1

  return (
    <div className={styles.gantt}>
      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.navBtn} onClick={() => setWeekOffset(w => w - 1)}>← Prev</button>
        <span className={styles.rangeLabel}>
          {toDateStr(timelineStart)} – {toDateStr(timelineEnd)}
        </span>
        <button className={styles.navBtn} onClick={() => setWeekOffset(w => w + 1)}>Next →</button>
      </div>

      {/* Chart area */}
      <div className={styles.chartWrap} ref={scrollRef}>
        {/* Label column */}
        <div className={styles.labelCol} style={{ width: LABEL_WIDTH }}>
          {/* Header spacer */}
          <div className={styles.labelHeader}>Task</div>
          {rows.map((row, i) =>
            row.type === "group" ? (
              <div key={`g-${i}`} className={styles.groupLabel}>{row.label}</div>
            ) : (
              <div key={row.task.id} className={styles.taskLabel}>
                {row.task.title}
              </div>
            )
          )}
        </div>

        {/* Scrollable timeline */}
        <div className={styles.timelineScroll}>
          {/* Days header */}
          <div className={styles.daysHeader} style={{ width: TOTAL_WIDTH }}>
            {days.map((d, i) => (
              <div
                key={i}
                className={`${styles.dayCell} ${toDateStr(d) === toDateStr(today) ? styles.dayCellToday : ""}`}
                style={{ width: TOTAL_WIDTH / dayCount }}
              >
                <span className={styles.dayLabel}>{DAY_LABELS[d.getDay()]}</span>
                <span className={styles.dayNum}>{d.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Grid + bars */}
          <div className={styles.gridArea} style={{ width: TOTAL_WIDTH }}>
            {/* Vertical day lines */}
            {days.map((_, i) => (
              <div
                key={i}
                className={styles.dayLine}
                style={{ left: (i / dayCount) * TOTAL_WIDTH }}
              />
            ))}

            {/* Today line */}
            {todayLeft >= 0 && todayLeft <= TOTAL_WIDTH && (
              <div className={styles.todayLine} style={{ left: todayLeft }} />
            )}

            {/* Rows */}
            {rows.map((row, i) => {
              if (row.type === "group") {
                return (
                  <div key={`gr-${i}`} className={styles.groupRow} />
                )
              }
              taskRowCounter++
              const pos = barPositions[row.task.id]
              const color = STATUS_COLORS[row.task.status]
              const top = taskRowCounter * ROW_HEIGHT

              return (
                <div key={row.task.id} className={styles.taskRow} style={{ top }}>
                  <div
                    className={styles.taskBar}
                    style={{
                      left: pos.left,
                      width: pos.width,
                      background: color,
                    }}
                    onMouseEnter={e => setTooltip({ task: row.task, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => setDetailTask(row.task)}
                  >
                    <span className={styles.barLabel}>{row.task.title}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <div className={styles.tooltipTitle}>{tooltip.task.title}</div>
          <div className={styles.tooltipRow}>Status: {tooltip.task.status}</div>
          <div className={styles.tooltipRow}>Priority: {tooltip.task.priority}</div>
          {tooltip.task.dueDate && (
            <div className={styles.tooltipRow}>Due: {tooltip.task.dueDate}</div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detailTask && (
        <div className={styles.modalOverlay} onClick={() => setDetailTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>{detailTask.title}</div>
            {detailTask.description && (
              <p className={styles.modalDesc}>{detailTask.description}</p>
            )}
            <div className={styles.modalMeta}>
              <span>Status: <strong>{detailTask.status}</strong></span>
              <span>Priority: <strong>{detailTask.priority}</strong></span>
              <span>Tag: <strong>{detailTask.tag}</strong></span>
              {detailTask.dueDate && <span>Due: <strong>{detailTask.dueDate}</strong></span>}
            </div>
            <button className={styles.modalClose} onClick={() => setDetailTask(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskGanttView
