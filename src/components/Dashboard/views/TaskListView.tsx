"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./TaskListView.module.scss"
import { useProductivityStore } from "@/stores/productivityStore"
import type { Task, Priority, TaskStatus, TaskTag } from "@/types/productivity"

// ── Helpers ──────────────────────────────────────────────────────────────────
type DisplayPriority = "high" | "med" | "low"
function toDisplayPri(p: Priority): DisplayPriority { return p === "medium" ? "med" : p as DisplayPriority }
function toStorePri(p: DisplayPriority): Priority { return p === "med" ? "medium" : p as Priority }

const PRI_COLOR: Record<DisplayPriority, string> = {
  high: "oklch(0.65 0.15 20)",
  med: "oklch(0.75 0.14 60)",
  low: "oklch(0.65 0.14 150)",
}

type SortKey = "priority" | "dueDate" | "title"
const PRI_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

// ── Component ─────────────────────────────────────────────────────────────────
const TaskListView: React.FC = () => {
  const tasks = useProductivityStore(s => s.tasks)
  const updateTask = useProductivityStore(s => s.updateTask)
  const deleteTask = useProductivityStore(s => s.deleteTask)
  const toggleTask = useProductivityStore(s => s.toggleTask)

  // Filters
  const [filterPri, setFilterPri] = useState<"all" | DisplayPriority>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("dueDate")

  // Expanded rows & subtask visibility
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const activeTasks = useMemo(() => tasks.filter(t => !t.isDeleted), [tasks])

  const filtered = useMemo(() => {
    let list = activeTasks
    if (filterPri !== "all") {
      list = list.filter(t => toDisplayPri(t.priority) === filterPri)
    }
    if (filterStatus !== "all") {
      list = list.filter(t => t.status === filterStatus)
    }
    if (filterFrom) list = list.filter(t => t.dueDate && t.dueDate >= filterFrom)
    if (filterTo) list = list.filter(t => t.dueDate && t.dueDate <= filterTo)

    return [...list].sort((a, b) => {
      if (sortKey === "priority") return PRI_ORDER[a.priority] - PRI_ORDER[b.priority]
      if (sortKey === "title") return a.title.localeCompare(b.title)
      // dueDate: nulls last
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }, [activeTasks, filterPri, filterStatus, filterFrom, filterTo, sortKey])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(t => t.id)))
    }
  }

  const bulkComplete = () => {
    for (const id of selected) {
      const task = tasks.find(t => t.id === id)
      if (task && !task.completed) toggleTask(id)
    }
    setSelected(new Set())
  }

  const bulkDelete = async () => {
    for (const id of selected) {
      await deleteTask(id)
    }
    setSelected(new Set())
  }

  const SortBtn: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => (
    <button
      className={`${styles.sortBtn} ${sortKey === k ? styles.sortBtnActive : ""}`}
      onClick={() => setSortKey(k)}
    >
      {label}
    </button>
  )

  return (
    <div className={styles.listView}>
      {/* Filter row */}
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={filterPri}
          onChange={e => setFilterPri(e.target.value as any)}
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <input
          type="date"
          className={styles.filterSelect}
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          title="Due from"
        />
        <input
          type="date"
          className={styles.filterSelect}
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          title="Due to"
        />

        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>Sort:</span>
          <SortBtn k="priority" label="Priority" />
          <SortBtn k="dueDate" label="Due Date" />
          <SortBtn k="title" label="Title" />
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <motion.div
          className={styles.bulkBar}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <span className={styles.bulkCount}>{selected.size} selected</span>
          <button className={styles.bulkBtn} onClick={bulkComplete}>Mark complete</button>
          <button className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={bulkDelete}>Delete</button>
          <button className={styles.bulkBtnGhost} onClick={() => setSelected(new Set())}>Clear</button>
        </motion.div>
      )}

      {/* Table header */}
      <div className={styles.tableHead}>
        <div className={`${styles.colCheck}`}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={selectAll}
          />
        </div>
        <div className={`${styles.col} ${styles.colTitle}`}>Title</div>
        <div className={`${styles.col} ${styles.colPri}`}>Priority</div>
        <div className={`${styles.col} ${styles.colStatus}`}>Status</div>
        <div className={`${styles.col} ${styles.colDue}`}>Due Date</div>
        <div className={`${styles.col} ${styles.colTag}`}>Tag</div>
      </div>

      {/* Rows */}
      <div className={styles.tableBody}>
        <AnimatePresence initial={false}>
          {filtered.map(task => {
            const dp = toDisplayPri(task.priority)
            const isExpanded = expandedId === task.id
            const isChecked = selected.has(task.id)

            return (
              <motion.div
                key={task.id}
                className={`${styles.rowWrap} ${task.completed ? styles.rowDone : ""}`}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {/* Main row */}
                <div
                  className={`${styles.tableRow} ${isChecked ? styles.tableRowSelected : ""}`}
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                >
                  <div
                    className={styles.colCheck}
                    onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isChecked}
                      onChange={() => toggleSelect(task.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className={`${styles.col} ${styles.colTitle}`}>
                    <span
                      className={styles.completeDot}
                      onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                      style={{
                        background: task.completed ? "oklch(0.65 0.14 150)" : "transparent",
                        borderColor: task.completed ? "oklch(0.65 0.14 150)" : "oklch(0.4 0.03 260)",
                      }}
                    />
                    <span className={`${styles.titleText} ${task.completed ? styles.titleDone : ""}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className={`${styles.col} ${styles.colPri}`}>
                    <span
                      className={styles.priPill}
                      style={{ background: PRI_COLOR[dp] + "33", color: PRI_COLOR[dp] }}
                    >
                      {dp}
                    </span>
                  </div>
                  <div className={`${styles.col} ${styles.colStatus}`}>
                    <span className={`${styles.statusPill} ${styles[`status_${task.status}`]}`}>
                      {task.status === "inprogress" ? "In Progress" : task.status === "done" ? "Done" : "To Do"}
                    </span>
                  </div>
                  <div className={`${styles.col} ${styles.colDue}`}>
                    {task.dueDate ?? <span className={styles.noDate}>—</span>}
                  </div>
                  <div className={`${styles.col} ${styles.colTag}`}>
                    <span className={styles.tagPill}>{task.tag}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      className={styles.expandedRow}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={styles.expandedContent}>
                        <p className={styles.expandedDesc}>
                          {task.description || <em>No description.</em>}
                        </p>
                        <div className={styles.expandedActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                          >
                            {task.completed ? "Mark incomplete" : "Mark complete"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className={styles.empty}>No tasks match the current filters.</div>
        )}
      </div>
    </div>
  )
}

export default TaskListView
